import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  getSchedulingRequests,
  saveSchedulingRequest,
} from "@/lib/scheduling";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, action, confirmedTime, note } = await req.json();
  if (!requestId || !action) {
    return NextResponse.json(
      { error: "requestId and action required" },
      { status: 400 }
    );
  }

  const requests = await getSchedulingRequests(session.accessToken as string);
  const request = requests.find((r) => r.id === requestId);
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  request.status = action; // "approved" | "declined" | "alternative"
  request.confirmedTime = confirmedTime ?? "";
  request.note = note ?? "";

  await saveSchedulingRequest(session.accessToken as string, request);

  return NextResponse.json({ request });
}
