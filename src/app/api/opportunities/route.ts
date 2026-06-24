import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { opportunityVisibilityFilter } from "@/lib/pipeline-access";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { User } from "@/models/user";
import { postAppointmentSubmitted } from "@/lib/chat-service";

const submitSchema = z.object({ leadId: z.string(), closerId: z.string().optional() });

export async function GET(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const filter: Record<string, unknown> = await opportunityVisibilityFilter(user);
  const agentId = searchParams.get("agentId");
  const closerId = searchParams.get("closerId");
  const managerId = searchParams.get("managerId");
  const stage = searchParams.get("stage");
  if (agentId && Types.ObjectId.isValid(agentId)) Object.assign(filter, { setter: agentId });
  if (closerId && Types.ObjectId.isValid(closerId)) Object.assign(filter, { closer: closerId });
  if (managerId && Types.ObjectId.isValid(managerId)) Object.assign(filter, { managerSnapshot: managerId });
  if (stage) Object.assign(filter, { stage });

  const items = await Opportunity.find(filter)
    .sort({ dateSubmitted: -1 })
    .populate("lead", "customerName businessName phoneNumber email")
    .populate("setter closer teamLeadSnapshot managerSnapshot", "name email role")
    .lean();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = submitSchema.parse(await request.json());
    if (!Types.ObjectId.isValid(input.leadId)) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    const lead = await Lead.findById(input.leadId).populate("assignedAgent", "teamLead manager");
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (user.role === "AGENT" && String(lead.assignedAgent?._id ?? lead.assignedAgent) !== user.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const setterId = String(lead.assignedAgent?._id ?? lead.assignedAgent ?? user.sub);
    const setter = await User.findById(setterId).select("teamLead manager").lean<{ teamLead?: Types.ObjectId | null; manager?: Types.ObjectId | null }>();
    const now = new Date();
    const opportunity = await Opportunity.create({
      lead: lead.id,
      setter: setterId,
      closer: input.closerId ?? setter?.teamLead ?? null,
      teamLeadSnapshot: setter?.teamLead ?? null,
      managerSnapshot: setter?.manager ?? null,
      stage: "SUBMITTED",
      dateSubmitted: now,
      stageHistory: [{ from: null, to: "SUBMITTED", actor: user.sub, changedAt: now }],
    });
    lead.status = "SUBMITTED";
    await lead.save();
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "SUBMITTED_APPOINTMENT", targetType: "OPPORTUNITY", targetId: opportunity.id, after: { leadId: lead.id } });
    await postAppointmentSubmitted({ senderId: user.sub, opportunityId: opportunity.id, businessName: lead.businessName, customerName: lead.customerName });
    return NextResponse.json({ item: opportunity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Submission validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to submit appointment" }, { status: 500 });
  }
}
