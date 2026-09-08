import { notFound } from "next/navigation";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { LeadDetail } from "@/components/leads/lead-detail";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/lead";
import { User } from "@/models/user";
import { leadVisibilityFilter } from "@/lib/pipeline-access";

import { Types } from "mongoose";
import { FollowUp } from "@/models/follow-up";
import { timeZoneLabel } from "@/lib/us-timezones";

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ action?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireActiveUser();
  if (!user) return null;
  if (!Types.ObjectId.isValid(id)) notFound();
  
  await connectToDatabase();
  const visibility = await leadVisibilityFilter(user);
  const lead = await Lead.findOne({ _id: id, ...visibility }).populate("assignedAgent assignedTeamLead", "name").lean();
  if (!lead) notFound();
  const followUps = await FollowUp.find({ lead: id }).sort({ handledAt: -1 }).limit(20).populate("actor", "name").lean();
  
  const agentName = (lead.assignedAgent as { name?: string } | undefined)?.name ?? "Unassigned";
  const stageAlias: Record<string, string> = {
    ACTIVE: "New", SUBMITTED: "Submitted", APPROVED: "Approved", REJECTED: "Rejected",
    REVERSED: "Reversed", IN_PROGRESS: "In Progress", APPROVED_WON: "Closed Won",
    APPROVED_LOST: "Closed Lost", CLOSED_WON: "Closed Won", CLOSED_LOST: "Closed Lost",
    ARCHIVED: "Archived",
  };
  
  const leadData = {
    id: String(lead._id),
    customer: String(lead.customerName),
    business: String(lead.businessName),
    source: String(lead.leadSource),
    agent: agentName,
    agentId: lead.assignedAgent && typeof lead.assignedAgent === "object" && "_id" in lead.assignedAgent ? String(lead.assignedAgent._id) : "",
    callback: lead.reachBackDate ? `${new Date(lead.reachBackDate).toLocaleString("en-US", { timeZone: lead.reachBackTimeZone || "America/New_York" })} · ${timeZoneLabel(lead.reachBackTimeZone)}` : "No callback set",
    timeZone: lead.reachBackTimeZone || "America/New_York",
    latestFollowUp: followUps[0] ? { comment: followUps[0].comment, outcome: followUps[0].outcome, handledAt: new Date(followUps[0].handledAt).toISOString(), actor: (followUps[0].actor as { name?: string } | null)?.name || "Agent", timeZone: followUps[0].nextReachBackTimeZone } : null,
    followUps: followUps.map((item) => ({ comment: item.comment, outcome: item.outcome, handledAt: new Date(item.handledAt).toISOString(), actor: (item.actor as { name?: string } | null)?.name || "Agent", nextReachBackDate: item.nextReachBackDate ? new Date(item.nextReachBackDate).toISOString() : null, timeZone: item.nextReachBackTimeZone })),
    stage: stageAlias[String(lead.status)] ?? String(lead.status),
    value: lead.price ? `$${Number(lead.price).toLocaleString()}` : "-",
    phone: String(lead.phoneNumber ?? ""),
    email: String(lead.email ?? ""),
    niche: String(lead.niche ?? ""),
  };
  const assignableAgents = user.role === "AGENT"
    ? []
    : await User.find(user.role === "TEAM_LEAD"
      ? { active: true, $or: [{ _id: user.sub, role: "TEAM_LEAD" }, { role: "AGENT", teamLead: user.sub }] }
      : { active: true, role: "AGENT" })
      .select("_id name")
      .sort({ name: 1 })
      .lean();
  
  return <AnimatedPage><PageHeader title="Lead details" description="Contact data, follow-up history, ownership, and appointment submission." /><LeadDetail initialLead={leadData} initialAction={query.action} currentRole={user.role} assignableAgents={assignableAgents.map((item) => ({ id: String(item._id), name: item.name }))} /></AnimatedPage>;
}
