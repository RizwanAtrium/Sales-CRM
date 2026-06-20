import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { DailyCallStat } from "@/models/daily-call-stat";

const callStatSchema = z.object({
  date: z.coerce.date(),
  callsMade: z.number().int().min(0),
  connected: z.number().int().min(0),
  conversationsTwoMinutes: z.number().int().min(0),
  callsBooked: z.number().int().min(0),
  approved: z.number().int().min(0),
  noShows: z.number().int().min(0),
  notes: z.string().optional().default(""),
  offDay: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const filter: Record<string, unknown> = user.role === "AGENT" ? { agent: user.sub } : {};
  if (from || to) filter.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  const items = await DailyCallStat.find(filter).sort({ date: -1 }).populate("agent", "name").lean();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = callStatSchema.parse(await request.json());
    const date = new Date(input.date);
    date.setUTCHours(0, 0, 0, 0);
    const item = await DailyCallStat.findOneAndUpdate({ agent: user.sub, date }, { ...input, date, agent: user.sub }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "SAVED_CALL_STATS", targetType: "DAILY_CALL_STAT", targetId: item.id, after: input });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Call-stat validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to save call stats" }, { status: 500 });
  }
}
