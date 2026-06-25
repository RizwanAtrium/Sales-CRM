import { notFound } from "next/navigation";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { LeadDetail } from "@/components/leads/lead-detail";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/lead";
import { leadVisibilityFilter } from "@/lib/pipeline-access";

import { Types } from "mongoose";

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
  
  const agentName = (lead.assignedAgent as { name?: string } | undefined)?.name ?? "Unassigned";
  const closerName = (lead.assignedTeamLead as { name?: string } | undefined)?.name ?? "Unassigned";
  
  const stageAlias: Record<string, string> = {
    ACTIVE: "New", SUBMITTED: "Submitted", APPROVED: "Approved", REJECTED: "Rejected",
    REVERSED: "Reversed", IN_PROGRESS: "In Progress", APPROVED_WON: "Closed Won",
    APPROVED_LOST: "Closed Lost", CLOSED_WON: "Closed Won", CLOSED_LOST: "Closed Lost",
  };
  
  const leadData = {
    id: String(lead._id),
    customer: String(lead.customerName),
    business: String(lead.businessName),
    source: String(lead.leadSource),
    agent: agentName,
    callback: lead.reachBackDate ? new Date(lead.reachBackDate).toLocaleString("en-US", { timeZone: "America/New_York" }) : "No callback set",
    stage: stageAlias[String(lead.status)] ?? String(lead.status),
    value: lead.price ? `$${Number(lead.price).toLocaleString()}` : "-",
    phone: String(lead.phoneNumber ?? ""),
    email: String(lead.email ?? ""),
    niche: String(lead.niche ?? ""),
  };
  
  return <AnimatedPage><PageHeader title="Lead details" description="Contact data, follow-up history, ownership, and appointment submission." /><LeadDetail initialLead={leadData} initialAction={query.action} /></AnimatedPage>;
}
