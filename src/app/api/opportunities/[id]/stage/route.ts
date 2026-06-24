import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { canMoveOpportunityStage, opportunityVisibilityFilter } from "@/lib/pipeline-access";
import { createClosedSaleNotifications } from "@/lib/notifications";
import { postAppointmentStatus } from "@/lib/chat-service";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { User } from "@/models/user";

const schema = z.object({
  stage: z.enum(["IN_PROGRESS", "REJECTED", "REVERSED", "APPROVED", "APPROVED_WON", "APPROVED_LOST", "CLOSED_WON", "CLOSED_LOST"]),
  serviceLines: z.array(z.object({ serviceName: z.string().min(1), price: z.number().min(0) })).optional(),
  closerId: z.string().optional(),
});

function idString(value: unknown) {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === "object" && value !== null && "_id" in value) return String((value as { _id: unknown })._id);
  return String(value);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    if (!canMoveOpportunityStage(user.role, input.stage)) return NextResponse.json({ error: "This role cannot move the opportunity to that stage" }, { status: 403 });
    const visibility = await opportunityVisibilityFilter(user);
    const opportunity = await Opportunity.findOne({ _id: id, ...visibility }).populate("lead", "businessName customerName");
    if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (["APPROVED", "REJECTED", "REVERSED"].includes(input.stage) && !hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Team Lead access required" }, { status: 403 });
    if (["APPROVED_WON", "APPROVED_LOST", "CLOSED_WON", "CLOSED_LOST"].includes(input.stage) && !hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Closer or manager access required" }, { status: 403 });
    const before = opportunity.toObject();
    const now = new Date();
    const closerId = input.closerId && Types.ObjectId.isValid(input.closerId) ? input.closerId : input.stage === "CLOSED_WON" || input.stage === "CLOSED_LOST" ? user.sub : idString(opportunity.closer);
    const closer = closerId ? await User.findById(closerId).select("_id name role teamLead manager").lean<{ _id: Types.ObjectId; name: string; teamLead?: Types.ObjectId | null; manager?: Types.ObjectId | null }>() : null;
    opportunity.stageHistory.push({ from: opportunity.stage, to: input.stage, actor: user.sub, changedAt: now });
    opportunity.stage = input.stage;
    if (closerId) opportunity.closer = closerId;
    if (!opportunity.teamLeadSnapshot && closer?.teamLead) opportunity.teamLeadSnapshot = closer.teamLead;
    if (!opportunity.managerSnapshot && closer?.manager) opportunity.managerSnapshot = closer.manager;
    if (input.stage === "APPROVED") opportunity.dateApproved = opportunity.dateApproved ?? now;
    if (input.stage === "APPROVED_WON" || input.stage === "CLOSED_WON") {
      opportunity.dateClosedWon = opportunity.dateClosedWon ?? now;
      opportunity.serviceLines = input.serviceLines ?? opportunity.serviceLines;
      opportunity.totalDealValue = opportunity.serviceLines.reduce((sum: number, line: { price: number }) => sum + Number(line.price || 0), 0);
      opportunity.amountToReceive = Math.max(opportunity.totalDealValue - opportunity.amountReceived, 0);
      opportunity.paymentStatus = opportunity.amountReceived >= opportunity.totalDealValue && opportunity.totalDealValue > 0 ? "PAID_IN_FULL" : opportunity.amountReceived > 0 ? "PARTIAL" : "UNPAID";
    }
    if (input.stage === "APPROVED_LOST" || input.stage === "CLOSED_LOST") opportunity.dateClosedLost = opportunity.dateClosedLost ?? now;
    await opportunity.save();
    await Lead.findByIdAndUpdate(opportunity.lead, { status: input.stage, terminalAt: ["APPROVED_WON", "APPROVED_LOST", "CLOSED_WON", "CLOSED_LOST", "REJECTED", "REVERSED"].includes(input.stage) ? now : null });
    const lead = opportunity.lead as unknown as { businessName?: string; customerName?: string };
    await postAppointmentStatus({ senderId: user.sub, opportunityId: opportunity.id, businessName: lead.businessName ?? "Appointment", customerName: lead.customerName ?? "Customer", stage: input.stage });
    if (input.stage === "APPROVED_WON" || input.stage === "CLOSED_WON") {
      await createClosedSaleNotifications({
        opportunityId: opportunity.id,
        businessName: lead.businessName ?? "Closed sale",
        customerName: lead.customerName ?? "Customer",
        closerName: closer?.name ?? user.name,
        closerId: idString(opportunity.closer),
        teamLeadId: idString(opportunity.teamLeadSnapshot),
        managerId: idString(opportunity.managerSnapshot),
        totalDealValue: opportunity.totalDealValue,
      });
    }
    await recordAudit({ actorId: user.sub, actorName: user.name, action: `OPPORTUNITY_${input.stage}`, targetType: "OPPORTUNITY", targetId: id, before, after: opportunity.toObject() });
    return NextResponse.json({ item: opportunity });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Stage validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to update opportunity" }, { status: 500 });
  }
}
