import { deliverSalesHandoff, type SalesHandoffPayload } from "@/lib/cst-integration";
import { recordAudit } from "@/lib/audit";
import { Handoff } from "@/models/handoff";
import { Opportunity } from "@/models/opportunity";

type Actor = { sub: string; name: string; email: string; role: string };
type HandoffOptions = {
  opportunityId: string;
  actor: Actor;
  cstManagerId?: string;
  workStartDate?: Date;
  forceStageForward?: boolean;
};

type Party = { name?: string; email?: string } | null | undefined;

function partyPayload(party: Party) {
  if (!party?.name) return undefined;
  return { name: party.name, email: party.email ?? "" };
}

function mapServices(lines: Array<{ serviceName?: string; price?: number }> | undefined, totalDealValue: number) {
  const services = (lines ?? [])
    .filter((line) => line.serviceName && Number(line.price ?? 0) >= 0)
    .map((line) => ({ name: String(line.serviceName), amount: Number(line.price ?? 0) }));

  if (services.length > 0) return services;
  return [{ name: "Sales Package", amount: Number(totalDealValue || 0) }];
}

export async function createOrDeliverCstHandoff({ opportunityId, actor, cstManagerId, workStartDate, forceStageForward = false }: HandoffOptions) {
  const opportunity = await Opportunity.findById(opportunityId)
    .populate("lead")
    .populate({ path: "closer", select: "name email" })
    .populate({ path: "setter", select: "name email teamLead manager", populate: [{ path: "teamLead", select: "name email" }, { path: "manager", select: "name email" }] })
    .populate("teamLeadSnapshot managerSnapshot", "name email");

  if (!opportunity) throw new Error("Opportunity not found");
  if (!["APPROVED_WON", "CLOSED_WON", "FORWARDED_TO_CST"].includes(opportunity.stage)) throw new Error("Only Approved-Won opportunities can be handed off");
  if (opportunity.paymentStatus !== "PAID_IN_FULL") throw new Error("CST handoff requires Paid in Full");

  const lead = opportunity.lead as unknown as Record<string, string>;
  const closer = partyPayload(opportunity.closer as unknown as Party) ?? { name: actor.name, email: actor.email };
  const setter = opportunity.setter as unknown as { teamLead?: Party; manager?: Party } | null;
  const teamLead = partyPayload(opportunity.teamLeadSnapshot as unknown as Party) ?? partyPayload(setter?.teamLead);
  const manager = partyPayload(opportunity.managerSnapshot as unknown as Party) ?? partyPayload(setter?.manager);

  const payload: SalesHandoffPayload = {
    handoffId: "pending",
    opportunityId,
    customer: {
      businessName: lead.businessName,
      customerName: lead.customerName,
      phoneNumber: lead.phoneNumber,
      mobileNumber: lead.mobileNumber,
      email: lead.email,
      businessAddress: lead.businessAddress,
      state: lead.state,
      country: lead.country,
    },
    services: mapServices(opportunity.serviceLines, Number(opportunity.totalDealValue || 0)),
    saleDate: (opportunity.dateClosedWon ?? opportunity.updatedAt ?? new Date()).toISOString(),
    paidAt: (opportunity.datePaid ?? opportunity.updatedAt ?? new Date()).toISOString(),
    workStartDate: workStartDate?.toISOString(),
    totalDealValue: Number(opportunity.totalDealValue || 0),
    amountReceived: Number(opportunity.amountReceived || 0),
    closer,
    teamLead,
    manager,
    cstManagerId,
  };

  const handoff = await Handoff.findOneAndUpdate(
    { opportunity: opportunityId },
    {
      opportunity: opportunityId,
      forwardingManager: actor.sub,
      cstManager: cstManagerId ?? "CST_MANAGER_QUEUE",
      cstHandler: null,
      payloadSnapshot: payload,
      status: "PENDING_ASSIGNMENT",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  payload.handoffId = handoff.id;
  let delivery: { created: boolean; clientId: string; lifecycleStage: string } | null = null;
  try {
    delivery = await deliverSalesHandoff(payload);
    handoff.status = "DELIVERED";
    handoff.externalReference = delivery.clientId;
    handoff.lastError = null;
  } catch (error) {
    handoff.status = "FAILED";
    handoff.lastError = error instanceof Error ? error.message : "CST delivery failed";
  }

  handoff.payloadSnapshot = payload;
  await handoff.save();

  if (delivery || forceStageForward) {
    opportunity.stage = "FORWARDED_TO_CST";
    opportunity.dateForwarded = opportunity.dateForwarded ?? new Date();
    await opportunity.save();
  }

  await recordAudit({
    actorId: actor.sub,
    actorName: actor.name,
    action: delivery ? "FORWARDED_TO_CST" : "CST_HANDOFF_SYNC_FAILED",
    targetType: "HANDOFF",
    targetId: handoff.id,
    after: { status: handoff.status, externalReference: handoff.externalReference, lastError: handoff.lastError },
  });

  return { handoff, delivery };
}
