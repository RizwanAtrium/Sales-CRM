import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { createOrDeliverCstHandoff } from "@/lib/handoff-service";
import { createClosedSaleNotifications } from "@/lib/notifications";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { Payment } from "@/models/payment";
import { User } from "@/models/user";

const serviceLineSchema = z.object({
  serviceName: z.string().trim().min(1),
  price: z.coerce.number().min(0),
});

const schema = z.object({
  amount: z.coerce.number().positive(),
  receivedAt: z.coerce.date().optional(),
  note: z.string().optional().default(""),
  businessName: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(1),
  mobileNumber: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  agentId: z.string().optional(),
  closerId: z.string().optional(),
  serviceLines: z.array(serviceLineSchema).min(1),
});

function isObjectId(value?: string | null) {
  return Boolean(value && Types.ObjectId.isValid(value));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (!["APPROVED_WON", "CLOSED_WON", "FORWARDED_TO_CST"].includes(opportunity.stage)) return NextResponse.json({ error: "Payments are allowed only after Approved-Won" }, { status: 400 });

    const agentId = isObjectId(input.agentId) ? input.agentId : user.sub;
    const closerId = isObjectId(input.closerId) ? input.closerId : user.sub;

    if (user.role === "AGENT" && (agentId !== user.sub || closerId !== user.sub)) {
      return NextResponse.json({ error: "Agents can only record their own sale and closer details" }, { status: 403 });
    }

    const [agent, closer] = await Promise.all([
      User.findOne({ _id: agentId, active: true }).select("_id name role teamLead manager").lean(),
      User.findOne({ _id: closerId, active: true }).select("_id name role").lean(),
    ]);
    if (!agent) return NextResponse.json({ error: "Selected agent is not active" }, { status: 400 });
    if (!closer) return NextResponse.json({ error: "Selected closer is not active" }, { status: 400 });

    const totalSoldAmount = input.serviceLines.reduce((sum, line) => sum + Number(line.price || 0), 0);
    if (totalSoldAmount <= 0) return NextResponse.json({ error: "At least one service must have a price greater than zero" }, { status: 400 });

    const payment = await Payment.create({
      opportunity: id,
      amount: input.amount,
      receivedAt: input.receivedAt ?? new Date(),
      note: input.note,
      enteredBy: user.sub,
      agent: agentId,
      closer: closerId,
      customerSnapshot: {
        businessName: input.businessName,
        customerName: input.customerName,
        phoneNumber: input.phoneNumber,
        mobileNumber: input.mobileNumber,
        email: input.email,
      },
      serviceLines: input.serviceLines,
      totalSoldAmount,
    });

    await Lead.findByIdAndUpdate(opportunity.lead, {
      businessName: input.businessName,
      customerName: input.customerName,
      phoneNumber: input.phoneNumber,
      mobileNumber: input.mobileNumber,
      email: input.email,
      assignedAgent: agentId,
      status: opportunity.stage,
    });

    opportunity.setter = agentId;
    opportunity.closer = closerId;
    opportunity.teamLeadSnapshot = agent.teamLead ?? opportunity.teamLeadSnapshot ?? null;
    opportunity.managerSnapshot = agent.manager ?? opportunity.managerSnapshot ?? null;
    opportunity.serviceLines = input.serviceLines;
    opportunity.totalDealValue = totalSoldAmount;
    opportunity.amountReceived = Number(opportunity.amountReceived || 0) + input.amount;
    opportunity.amountToReceive = Math.max(totalSoldAmount - opportunity.amountReceived, 0);
    opportunity.paymentStatus = opportunity.amountToReceive <= 0 && totalSoldAmount > 0 ? "PAID_IN_FULL" : "PARTIAL";
    if (opportunity.paymentStatus === "PAID_IN_FULL") opportunity.datePaid = opportunity.datePaid ?? new Date();
    await opportunity.save();

    await recordAudit({
      actorId: user.sub,
      actorName: user.name,
      action: "RECORDED_PAYMENT",
      targetType: "PAYMENT",
      targetId: payment.id,
      after: {
        opportunity: id,
        amount: input.amount,
        totalSoldAmount,
        paymentStatus: opportunity.paymentStatus,
        agentId,
        closerId,
        customer: input.businessName,
        services: input.serviceLines,
      },
    });

    let handoff = null;
    if (opportunity.paymentStatus === "PAID_IN_FULL") {
      await createClosedSaleNotifications({
        opportunityId: id,
        businessName: input.businessName,
        customerName: input.customerName,
        closerName: closer.name,
        closerId,
        teamLeadId: String(agent.teamLead ?? "") || null,
        managerId: String(agent.manager ?? "") || null,
        totalDealValue: totalSoldAmount,
      });
      const result = await createOrDeliverCstHandoff({ opportunityId: id, actor: user });
      handoff = result.handoff;
    }
    return NextResponse.json({ item: payment, opportunity, handoff });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Payment validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to record payment" }, { status: 500 });
  }
}
