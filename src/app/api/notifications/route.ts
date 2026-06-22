import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { requireActiveUser } from "@/lib/require-user";
import { createMissedReachBackNotifications } from "@/lib/notifications";
import { Notification } from "@/models/notification";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  await createMissedReachBackNotifications();
  const items = await Notification.find({ recipient: user.sub }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ items });
}

const markReadSchema = z.object({ ids: z.array(z.string()).optional(), all: z.boolean().optional() });

export async function PATCH(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = markReadSchema.parse(await request.json());
  await connectToDatabase();
  const filter: Record<string, unknown> = { recipient: user.sub };
  if (!input.all) filter._id = { $in: input.ids ?? [] };
  await Notification.updateMany(filter, { $set: { read: true } });
  return NextResponse.json({ ok: true });
}
