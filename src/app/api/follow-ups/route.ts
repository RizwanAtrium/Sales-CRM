import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { FollowUp } from "@/models/follow-up";
import { Lead } from "@/models/lead";
import { createMissedReachBackNotifications } from "@/lib/notifications";

const schema = z.object({ leadId: z.string().min(1), outcome: z.enum(["CONNECTED", "NO_ANSWER", "VOICEMAIL", "RESCHEDULE", "CONTINUE", "CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED"]), notes: z.string().optional().default(""), nextReachBackDate: z.coerce.date().optional(), nextReachBackTimeZone: z.string().optional().default("America/New_York") });

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await createMissedReachBackNotifications();
  const filter: Record<string, unknown> = {};
  const leadId = request.nextUrl.searchParams.get("leadId");
  if (leadId) filter.lead = leadId;
  if (user.role === "AGENT") filter.actor = user.sub;
  const items = await FollowUp.find(filter).sort({ handledAt: -1 }).populate("lead", "businessName customerName").populate("actor", "name").lean();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const lead = await Lead.findById(input.leadId);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (user.role === "AGENT" && String(lead.assignedAgent) !== user.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (["RESCHEDULE", "CONTINUE"].includes(input.outcome) && !input.nextReachBackDate) return NextResponse.json({ error: "Next callback date and time required" }, { status: 400 });
    const item = await FollowUp.create({ lead: input.leadId, actor: user.sub, outcome: input.outcome, disposition: input.outcome, comment: input.notes, previousReachBackDate: lead.reachBackDate ?? null, nextReachBackDate: input.nextReachBackDate, nextReachBackTimeZone: input.nextReachBackTimeZone });
    if (input.nextReachBackDate) {
      lead.reachBackDate = input.nextReachBackDate;
      lead.reachBackTimeZone = input.nextReachBackTimeZone;
      lead.lastReachBackNotificationAt = null;
    }
    lead.status = ["CONNECTED", "NO_ANSWER", "VOICEMAIL", "RESCHEDULE", "CONTINUE"].includes(input.outcome) ? "ACTIVE" : input.outcome;
    await lead.save();
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "LOGGED_FOLLOW_UP", targetType: "LEAD", targetId: input.leadId, after: input });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Follow-up validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to save follow-up" }, { status: 500 });
  }
}
