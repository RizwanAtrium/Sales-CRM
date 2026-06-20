import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";
import { FollowUp } from "@/models/follow-up";

const followUpSchema = z.object({
  comment: z.string().min(1),
  nextReachBackDate: z.coerce.date().optional(),
  outcome: z.enum(["CONTINUE", "CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED"]).default("CONTINUE"),
}).superRefine((value, context) => {
  if (value.outcome === "CONTINUE" && !value.nextReachBackDate) {
    context.addIssue({ code: "custom", message: "A next reach-back date is required" });
  }
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });

  try {
    const input = followUpSchema.parse(await request.json());
    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (user.role === "AGENT" && String(lead.assignedAgent) !== user.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const before = { reachBackDate: lead.reachBackDate, status: lead.status };
    const terminal = input.outcome !== "CONTINUE";
    lead.reachBackDate = input.nextReachBackDate ?? null;
    if (terminal) {
      lead.status = input.outcome;
      lead.terminalAt = new Date();
    }
    await lead.save();
    const followUp = await FollowUp.create({ lead: lead.id, actor: user.sub, comment: input.comment, previousReachBackDate: before.reachBackDate, nextReachBackDate: input.nextReachBackDate ?? null, outcome: input.outcome });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "HANDLED_FOLLOW_UP", targetType: "LEAD", targetId: lead.id, before, after: { reachBackDate: lead.reachBackDate, status: lead.status } });
    return NextResponse.json({ item: followUp, lead });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Follow-up validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to handle follow-up" }, { status: 500 });
  }
}
