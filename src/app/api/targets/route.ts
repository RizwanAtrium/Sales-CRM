import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { WeeklyTarget } from "@/models/weekly-target";

const targetSchema = z.object({
  weekStart: z.coerce.date(),
  metric: z.enum(["CALLS_MADE", "CONNECTED", "CONVERSATIONS_TWO_MINUTES", "CALLS_BOOKED", "APPROVED", "NO_SHOWS"]),
  value: z.number().min(0),
  scope: z.enum(["COMPANY", "TEAM", "AGENT"]).default("COMPANY"),
  scopeId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const weekStart = request.nextUrl.searchParams.get("weekStart");
  return NextResponse.json({ items: await WeeklyTarget.find(weekStart ? { weekStart: new Date(weekStart) } : {}).sort({ weekStart: -1 }).lean() });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  try {
    const input = targetSchema.parse(await request.json());
    const item = await WeeklyTarget.findOneAndUpdate(
      { weekStart: input.weekStart, metric: input.metric, scope: input.scope, scopeId: input.scopeId ?? null },
      { ...input, scopeId: input.scopeId ?? null, createdBy: user.sub },
      { upsert: true, new: true, runValidators: true },
    );
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "SAVED_WEEKLY_TARGET", targetType: "WEEKLY_TARGET", targetId: item.id, after: input });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Target validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to save target" }, { status: 500 });
  }
}
