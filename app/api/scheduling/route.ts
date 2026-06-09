import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Anthropic from "@anthropic-ai/sdk";
import { google } from "googleapis";
import { getCalendarClient } from "@/lib/google-drive";
import {
  getSchedulingRequests,
  saveSchedulingRequest,
} from "@/lib/scheduling";

async function sendEmailNotification(
  accessToken: string,
  to: string,
  requestedBy: string,
  message: string,
  suggestedTimes: string[]
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  const timesHtml = suggestedTimes
    .map((t) => `<li style="margin:4px 0">${t}</li>`)
    .join("");

  const bodyHtml = `
<p>Hi Tony,</p>
<p><strong>${requestedBy}</strong> submitted a scheduling request:</p>
<blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${message}</blockquote>
<p>Suggested time windows:</p>
<ul>${timesHtml}</ul>
<p><a href="${process.env.NEXTAUTH_URL}/category/house-projects">Open House Projects</a> to approve, decline, or suggest an alternative.</p>
`;

  const rawMessage = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: Scheduling request from ${requestedBy}`,
    "",
    bodyHtml,
  ].join("\n");

  const encoded = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await getSchedulingRequests(session.accessToken as string);
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, requestedBy } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Fetch busy times from Tony's calendars for the next 14 days
  const calendarClient = getCalendarClient(session.accessToken as string);
  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  let busySlots: { start: string; end: string }[] = [];
  try {
    const calListRes = await calendarClient.calendarList.list({
      minAccessRole: "reader",
    });
    const EXCLUDED_CALENDARS = new Set([
      "ashleyrconrad@gmail.com",
      "aqis2e0f9fo45772998sc5eb3k@group.calendar.google.com", // Bright Horizons Events 2022
      "oldbellemusic@gmail.com",
    ]);
    const calItems = calListRes.data.items ?? [];
    console.log("[scheduling] calendars found:");
    calItems.forEach((c) => console.log(`  - ${c.summary} (${c.id})`));
    const calIds = [
      ...calItems.map((c) => c.id!).filter((id) => id && !EXCLUDED_CALENDARS.has(id)),
      "tnewstetter@salesforce.com",
    ];

    const freeBusyRes = await calendarClient.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: twoWeeksOut.toISOString(),
        items: calIds.map((id) => ({ id })),
      },
    });

    const calendars = freeBusyRes.data.calendars ?? {};
    busySlots = Object.values(calendars).flatMap(
      (cal) =>
        (cal.busy ?? []).map((b) => ({
          start: b.start ?? "",
          end: b.end ?? "",
        }))
    );
  } catch {
    // proceed without busy times
  }

  // Format busy slots as readable text (limit to keep prompt small)
  const busyText =
    busySlots.length > 0
      ? busySlots
          .slice(0, 40)
          .map((b) => {
            const s = new Date(b.start);
            const e = new Date(b.end);
            return `${s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}–${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
          })
          .join(", ")
      : "No busy times on record (some calendar blocks may be fake placeholders — human confirmation required)";

  const today = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const systemPrompt = `You are a scheduling assistant for a family home. Today is ${today}.
Someone at the house needs to schedule a service visit (plumber, electrician, handyman, etc.).
The homeowner (Tony) works from home but has calendar blocks that may not reflect real availability.

Your job: suggest 3–4 specific time windows when the homeowner COULD potentially be home to meet a service provider.
Suggestions should be weekday mornings (9am–12pm) or afternoons (1–5pm), within the next 7–14 days.
Format each suggestion as a single readable string like "Tuesday June 10, 10:00–12:00 AM" or "Thursday June 12, 2:00–4:00 PM".

Return ONLY a JSON object like:
{
  "summary": "one-sentence summary of the request",
  "suggestions": ["...", "...", "...", "..."]
}

No markdown, no explanation outside the JSON. Base suggestions around the busy times provided (which may include fake blocks — still suggest realistic windows and let Tony confirm).`;

  const userPrompt = `Request: "${message}"

Tony's calendar busy times for the next 2 weeks:
${busyText}

Suggest 3–4 time windows for this service visit.`;

  let summary = message;
  let suggestedTimes: string[] = [];

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 512,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const parsed = JSON.parse(text);
    summary = parsed.summary ?? message;
    suggestedTimes = parsed.suggestions ?? [];
  } catch {
    // Fall back to generic suggestions if Claude fails
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    suggestedTimes = Array.from({ length: 4 }).map((_, i) => {
      const d = new Date(tomorrow.getTime() + i * 24 * 60 * 60 * 1000);
      const day = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      return i % 2 === 0 ? `${day}, 10:00 AM–12:00 PM` : `${day}, 2:00–4:00 PM`;
    });
  }

  const newRequest = {
    id: crypto.randomUUID(),
    requestedBy: requestedBy ?? session.user?.name ?? "Michael",
    message,
    suggestedTimes,
    status: "pending" as const,
    confirmedTime: "",
    note: "",
    createdAt: now.toISOString(),
  };

  await saveSchedulingRequest(session.accessToken as string, newRequest);

  // Email notification — always goes to Tony regardless of who submitted
  const TONY_EMAIL = "tonya.newstetter@gmail.com";
  sendEmailNotification(
    session.accessToken as string,
    TONY_EMAIL,
    newRequest.requestedBy,
    message,
    suggestedTimes
  ).catch((err) => console.error("[scheduling] email failed:", err));

  return NextResponse.json({ request: newRequest, summary });
}
