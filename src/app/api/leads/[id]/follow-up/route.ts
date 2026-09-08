import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";
import { FollowUp } from "@/models/follow-up";
import { activeLeadFilter, leadVisibilityFilter } from "@/lib/pipeline-access";
import { zonedLocalToUtc } from "@/lib/timezone";

const followUpSchema = z.object({
  comment: z.string().min(1),
  nextReachBackDate: z.string().optional(),
  nextReachBackTimeZone: z.string().optional().default("America/New_York"),
  outcome: z.enum(["CONNECTED", "NO_ANSWER", "VOICEMAIL", "RESCHEDULE", "CONTINUE", "CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED"]).default("CONNECTED"),
}).superRefine((value, context) => {
  if (["CONTINUE", "RESCHEDULE"].includes(value.outcome) && !value.nextReachBackDate) {
    context.addIssue({ code: "custom", message: "A next callback date is required" });
  }
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });

  try {
    const input = followUpSchema.parse(await request.json());
    const visibility = await leadVisibilityFilter(user);
    const lead = await Lead.findOne({ _id: id, ...visibility, ...activeLeadFilter });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const before = { reachBackDate: lead.reachBackDate, status: lead.status };
    const terminal = !["CONNECTED", "NO_ANSWER", "VOICEMAIL", "RESCHEDULE", "CONTINUE"].includes(input.outcome);
    const nextDate = input.nextReachBackDate ? zonedLocalToUtc(input.nextReachBackDate, input.nextReachBackTimeZone) : null;
    lead.reachBackDate = nextDate;
    lead.reachBackTimeZone = input.nextReachBackTimeZone;
    lead.lastReachBackNotificationAt = null;
    if (terminal) {
      lead.status = input.outcome;
      lead.terminalAt = new Date();
    }
    await lead.save();
    const followUp = await FollowUp.create({ lead: lead.id, actor: user.sub, comment: input.comment, previousReachBackDate: before.reachBackDate, nextReachBackDate: nextDate, nextReachBackTimeZone: input.nextReachBackTimeZone, outcome: input.outcome, disposition: input.outcome });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "HANDLED_FOLLOW_UP", targetType: "LEAD", targetId: lead.id, before, after: { reachBackDate: lead.reachBackDate, status: lead.status } });
    return NextResponse.json({ item: followUp, lead });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Follow-up validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to handle follow-up" }, { status: 500 });
  }
}
