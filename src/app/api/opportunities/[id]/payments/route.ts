import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { createOrDeliverCstHandoff } from "@/lib/handoff-service";
import { Opportunity } from "@/models/opportunity";
import { Payment } from "@/models/payment";

const schema = z.object({ amount: z.coerce.number().positive(), receivedAt: z.coerce.date().optional(), note: z.string().optional().default("") });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (opportunity.stage !== "CLOSED_WON" && opportunity.stage !== "FORWARDED_TO_CST") return NextResponse.json({ error: "Payments are allowed only after Closed-Won" }, { status: 400 });
    const payment = await Payment.create({ opportunity: id, amount: input.amount, receivedAt: input.receivedAt ?? new Date(), note: input.note, enteredBy: user.sub });
    opportunity.amountReceived = Number(opportunity.amountReceived || 0) + input.amount;
    opportunity.amountToReceive = Math.max(Number(opportunity.totalDealValue || 0) - opportunity.amountReceived, 0);
    opportunity.paymentStatus = opportunity.amountToReceive <= 0 && Number(opportunity.totalDealValue || 0) > 0 ? "PAID_IN_FULL" : "PARTIAL";
    if (opportunity.paymentStatus === "PAID_IN_FULL") opportunity.datePaid = opportunity.datePaid ?? new Date();
    await opportunity.save();
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "RECORDED_PAYMENT", targetType: "PAYMENT", targetId: payment.id, after: { opportunity: id, amount: input.amount, paymentStatus: opportunity.paymentStatus } });
    let handoff = null;
    if (opportunity.paymentStatus === "PAID_IN_FULL") {
      const result = await createOrDeliverCstHandoff({ opportunityId: id, actor: user });
      handoff = result.handoff;
    }
    return NextResponse.json({ item: payment, opportunity, handoff });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Payment validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to record payment" }, { status: 500 });
  }
}
