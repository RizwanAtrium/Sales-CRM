import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { requireActiveUser } from "@/lib/require-user";
import { ChatMessage, ChatThread } from "@/models/chat";

const schema = z.object({ threadId: z.string().min(1), body: z.string().trim().min(1) });

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const threadId = request.nextUrl.searchParams.get("threadId");
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });

  await connectToDatabase();
  const thread = await ChatThread.findById(threadId).lean();
  if (!thread || (thread.type === "PRIVATE" && !thread.participants.map(String).includes(user.sub))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await ChatMessage.find({ thread: threadId }).sort({ createdAt: 1 }).populate("sender", "name role").lean();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = schema.parse(await request.json());

  await connectToDatabase();
  const thread = await ChatThread.findById(input.threadId);
  if (!thread || (thread.type === "PRIVATE" && !thread.participants.map(String).includes(user.sub))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const item = await ChatMessage.create({ thread: input.threadId, sender: user.sub, body: input.body });
  await ChatThread.findByIdAndUpdate(input.threadId, { updatedAt: new Date() });
  return NextResponse.json({ item }, { status: 201 });
}
