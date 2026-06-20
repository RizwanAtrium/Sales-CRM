import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";

const schema = z.object({
  stage: z.enum(["APPROVED", "UNAPPROVED", "IN_PROGRESS", "CLOSED_WON", "CLOSED_LOST"]),
  serviceLines: z.array(z.object({ serviceName: z.string().min(1), price: z.number().min(0) })).optional(),
  closerId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (["APPROVED", "UNAPPROVED"].includes(input.stage) && !hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Team Lead access required" }, { status: 403 });
    if (["CLOSED_WON", "CLOSED_LOST"].includes(input.stage) && !hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Closer or manager access required" }, { status: 403 });
    const before = opportunity.toObject();
    const now = new Date();
    opportunity.stageHistory.push({ from: opportunity.stage, to: input.stage, actor: user.sub, changedAt: now });
    opportunity.stage = input.stage;
    if (input.closerId) opportunity.closer = input.closerId;
    if (input.stage === "APPROVED") opportunity.dateApproved = opportunity.dateApproved ?? now;
    if (input.stage === "CLOSED_WON") {
      opportunity.dateClosedWon = opportunity.dateClosedWon ?? now;
      opportunity.serviceLines = input.serviceLines ?? opportunity.serviceLines;
      opportunity.totalDealValue = opportunity.serviceLines.reduce((sum: number, line: { price: number }) => sum + Number(line.price || 0), 0);
      opportunity.amountToReceive = Math.max(opportunity.totalDealValue - opportunity.amountReceived, 0);
      opportunity.paymentStatus = opportunity.amountReceived >= opportunity.totalDealValue && opportunity.totalDealValue > 0 ? "PAID_IN_FULL" : opportunity.amountReceived > 0 ? "PARTIAL" : "UNPAID";
    }
    if (input.stage === "CLOSED_LOST") opportunity.dateClosedLost = opportunity.dateClosedLost ?? now;
    await opportunity.save();
    await Lead.findByIdAndUpdate(opportunity.lead, { status: input.stage, terminalAt: ["CLOSED_WON", "CLOSED_LOST", "UNAPPROVED"].includes(input.stage) ? now : null });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: `OPPORTUNITY_${input.stage}`, targetType: "OPPORTUNITY", targetId: id, before, after: opportunity.toObject() });
    return NextResponse.json({ item: opportunity });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Stage validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to update opportunity" }, { status: 500 });
  }
}
