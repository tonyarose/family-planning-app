import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUpcomingEvents } from "@/lib/google-drive";
import { CATEGORY_KEYWORDS } from "@/lib/categories";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const keywords = CATEGORY_KEYWORDS[slug];
  if (!keywords) {
    return NextResponse.json({ events: [] });
  }

  const events = await getUpcomingEvents(session.accessToken, keywords);
  return NextResponse.json({ events });
}
