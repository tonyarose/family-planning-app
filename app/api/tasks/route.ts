import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTasks, saveTasks } from "@/lib/google-sheets";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = req.nextUrl.searchParams.get("category");
  if (!category) {
    return NextResponse.json({ error: "Missing category" }, { status: 400 });
  }

  const tasks = await getTasks(session.accessToken, category);
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, tasks } = await req.json();
  if (!category || !Array.isArray(tasks)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await saveTasks(session.accessToken, category, tasks);
  return NextResponse.json({ ok: true });
}
