import { ChatMessage, ChatThread } from "@/models/chat";

export async function ensureSystemGroups() {
  const submitted = await ChatThread.findOneAndUpdate(
    { key: "appointment-submitted" },
    { type: "GROUP", name: "Appointment Submitted", key: "appointment-submitted" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const status = await ChatThread.findOneAndUpdate(
    { key: "appointment-status" },
    { type: "GROUP", name: "Appointment Status", key: "appointment-status" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const leads = await ChatThread.findOneAndUpdate(
    { key: "lead-added" },
    { type: "GROUP", name: "New leads", key: "lead-added" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { submitted, status, leads };
}

export async function postAppointmentSubmitted(input: { senderId: string; opportunityId: string; businessName: string; customerName: string }) {
  const { submitted } = await ensureSystemGroups();
  return ChatMessage.create({
    thread: submitted._id,
    sender: input.senderId,
    body: `${input.customerName} at ${input.businessName}`,
    cardType: "APPOINTMENT_SUBMITTED",
    appointment: input.opportunityId,
    metadata: input,
  });
}

export async function postLeadCreated(input: {
  senderId: string;
  leadId: string;
  customerName: string;
  businessName: string;
  service: string;
  value: string;
  status: string;
  assignedAgentId: string;
}) {
  const { leads } = await ensureSystemGroups();
  return ChatMessage.create({
    thread: leads._id,
    sender: input.senderId,
    body: `${input.customerName} added ${input.businessName}`,
    cardType: "LEAD_ADDED",
    lead: input.leadId,
    metadata: {
      leadId: input.leadId,
      customerName: input.customerName,
      businessName: input.businessName,
      service: input.service,
      value: input.value,
      status: input.status,
      assignedAgentId: input.assignedAgentId,
    },
  });
}

export async function postAppointmentStatus(input: { senderId: string; opportunityId: string; businessName: string; customerName: string; stage: string }) {
  const { status } = await ensureSystemGroups();
  return ChatMessage.create({
    thread: status._id,
    sender: input.senderId,
    body: `${input.businessName} moved to ${input.stage}`,
    cardType: "APPOINTMENT_STATUS",
    appointment: input.opportunityId,
    metadata: input,
  });
}
