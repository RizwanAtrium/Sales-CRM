import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { requireActiveUser } from "@/lib/require-user";
import { ensureSystemGroups } from "@/lib/chat-service";
import { ChatMessage, ChatThread } from "@/models/chat";

const schema = z.object({ userId: z.string().min(1), name: z.string().optional() });

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  await ensureSystemGroups();
  const filter = { $or: [{ type: "GROUP" }, { participants: user.sub }] };
  const threads = await ChatThread.find(filter).sort({ updatedAt: -1 }).lean();
  const latest = await ChatMessage.find({ thread: { $in: threads.map((thread) => thread._id) } }).sort({ createdAt: -1 }).populate("sender", "name role").lean();
  return NextResponse.json({ items: threads.map((thread) => ({ ...thread, latest: latest.find((message) => String(message.thread) === String(thread._id)) ?? null })) });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = schema.parse(await request.json());

  await connectToDatabase();
  const participants = [user.sub, input.userId].sort();
  const thread = await ChatThread.findOneAndUpdate(
    { key: `private:${participants.join(":")}` },
    { type: "PRIVATE", name: input.name || "Private chat", key: `private:${participants.join(":")}`, participants },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return NextResponse.json({ item: thread }, { status: 201 });
}
