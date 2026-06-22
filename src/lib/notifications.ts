import { Types } from "mongoose";
import { Lead } from "@/models/lead";
import { Notification } from "@/models/notification";
import { User } from "@/models/user";
import { timeZoneLabel } from "@/lib/us-timezones";

type UserLite = { _id: Types.ObjectId; name: string; role: string; teamLead?: Types.ObjectId | null; manager?: Types.ObjectId | null };
type LeadLite = {
  _id: Types.ObjectId;
  businessName: string;
  customerName: string;
  assignedAgent: UserLite | Types.ObjectId;
  reachBackDate?: Date | null;
  reachBackTimeZone?: string | null;
  lastReachBackNotificationAt?: Date | null;
};

function idString(value: unknown) {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === "object" && value !== null && "_id" in value) return String((value as { _id: unknown })._id);
  return String(value);
}

export async function createNotification(input: { recipientId: string; title: string; detail: string; href: string; type?: "Follow-up" | "Approval" | "Payment" | "Security" | "System"; dedupeKey: string; metadata?: Record<string, unknown> }) {
  await Notification.updateOne(
    { recipient: input.recipientId, dedupeKey: input.dedupeKey },
    {
      $setOnInsert: {
        recipient: input.recipientId,
        title: input.title,
        detail: input.detail,
        href: input.href,
        type: input.type ?? "System",
        read: false,
        dedupeKey: input.dedupeKey,
        metadata: input.metadata ?? {},
      },
    },
    { upsert: true },
  );
}

export async function createMissedReachBackNotifications() {
  const now = new Date();
  const leads = await Lead.find({
    reachBackDate: { $lte: now },
    status: { $nin: ["CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED", "ARCHIVED"] },
    $or: [{ lastReachBackNotificationAt: null }, { lastReachBackNotificationAt: { $exists: false } }, { $expr: { $lt: ["$lastReachBackNotificationAt", "$reachBackDate"] } }],
  })
    .limit(50)
    .populate("assignedAgent", "name role teamLead manager")
    .lean<LeadLite[]>();

  if (!leads.length) return { created: 0 };

  const superAdmins = await User.find({ role: "SUPER_ADMIN", active: true }).select("_id").lean<{ _id: Types.ObjectId }[]>();
  let created = 0;

  for (const lead of leads) {
    const assigned = lead.assignedAgent as UserLite | undefined;
    const recipientIds = new Set<string>();
    const assignedId = idString(assigned);
    if (assignedId) recipientIds.add(assignedId);
    const teamLeadId = assigned && !(assigned instanceof Types.ObjectId) ? idString(assigned.teamLead) : null;
    const managerId = assigned && !(assigned instanceof Types.ObjectId) ? idString(assigned.manager) : null;
    if (teamLeadId) recipientIds.add(teamLeadId);
    if (managerId) recipientIds.add(managerId);
    for (const admin of superAdmins) recipientIds.add(admin._id.toString());

    const missedBy = assigned && !(assigned instanceof Types.ObjectId) ? assigned.name : "Assigned owner";
    const dueAt = lead.reachBackDate ? `${lead.reachBackDate.toLocaleString("en-US", { timeZone: lead.reachBackTimeZone || "America/New_York" })} ${timeZoneLabel(lead.reachBackTimeZone)}` : "the scheduled time";

    await Promise.all(
      [...recipientIds].map((recipientId) =>
        createNotification({
          recipientId,
          title: `${missedBy} missed a reach-back`,
          detail: `${missedBy} did not reach out to ${lead.customerName} at ${lead.businessName} by ${dueAt}.`,
          href: `/leads/${lead._id}?action=follow-up`,
          type: "Follow-up",
          dedupeKey: `missed-reachback:${lead._id}:${lead.reachBackDate?.toISOString() ?? "unknown"}`,
          metadata: { leadId: lead._id.toString(), missedBy },
        }),
      ),
    );
    created += recipientIds.size;
    await Lead.updateOne({ _id: lead._id }, { $set: { lastReachBackNotificationAt: now } });
  }

  return { created };
}

export async function createClosedSaleNotifications(input: { opportunityId: string; businessName: string; customerName: string; closerName: string; closerId?: string | null; teamLeadId?: string | null; managerId?: string | null; totalDealValue: number }) {
  const superAdmins = await User.find({ role: "SUPER_ADMIN", active: true }).select("_id").lean<{ _id: Types.ObjectId }[]>();
  const recipientIds = new Set<string>();
  if (input.closerId) recipientIds.add(input.closerId);
  if (input.teamLeadId) recipientIds.add(input.teamLeadId);
  if (input.managerId) recipientIds.add(input.managerId);
  for (const admin of superAdmins) recipientIds.add(admin._id.toString());

  await Promise.all(
    [...recipientIds].map((recipientId) =>
      createNotification({
        recipientId,
        title: `Sale closed by ${input.closerName}`,
        detail: `${input.businessName} (${input.customerName}) was marked Closed Won for $${Number(input.totalDealValue || 0).toLocaleString()}.`,
        href: `/pipeline/${input.opportunityId}`,
        type: "Payment",
        dedupeKey: `closed-sale:${input.opportunityId}`,
        metadata: { opportunityId: input.opportunityId, businessName: input.businessName, totalDealValue: input.totalDealValue },
      }),
    ),
  );

  return { recipients: recipientIds.size };
}
