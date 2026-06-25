import { notFound } from "next/navigation";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { OpportunityDetail } from "@/components/pipeline/opportunity-detail";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { Opportunity } from "@/models/opportunity";
import { opportunityVisibilityFilter } from "@/lib/pipeline-access";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActiveUser();
  if (!user) return null;
  await connectToDatabase();

  const visibility = await opportunityVisibilityFilter(user);
  const opportunity = await Opportunity.findOne({ _id: id, ...visibility })
    .populate("lead", "businessName customerName")
    .populate("setter closer teamLeadSnapshot managerSnapshot", "name")
    .lean();

  if (!opportunity) notFound();

  const lead = opportunity.lead as unknown as { businessName?: string; customerName?: string } | undefined;
  const setter = opportunity.setter as unknown as { name?: string } | undefined;
  const closer = opportunity.closer as unknown as { name?: string } | undefined;

  const business = lead?.businessName ?? "Untitled business";
  const contact = lead?.customerName ?? "Unknown";
  const value = `$${Number((opportunity as Record<string, unknown>).totalDealValue || 0).toLocaleString()}`;
  const owner = setter?.name ?? "Unassigned";
  const dateSubmitted = (opportunity as Record<string, unknown>).dateSubmitted;
  const nowMs = new Date().getTime();
  const age = dateSubmitted
    ? `${Math.max(0, Math.ceil((nowMs - new Date(String(dateSubmitted)).getTime()) / 86400000))}d`
    : "0d";
  const stageConfig: Record<string, string> = {
    SUBMITTED: "Submitted",
    IN_PROGRESS: "In Progress",
    REJECTED: "Rejected",
    REVERSED: "Reversed",
    APPROVED: "Approved",
    APPROVED_WON: "Approved Won",
    APPROVED_LOST: "Approved Lost",
    CLOSED_WON: "Approved Won",
    CLOSED_LOST: "Approved Lost",
  };
  const stage = stageConfig[String((opportunity as Record<string, unknown>).stage ?? "SUBMITTED")] ?? "Submitted";

  const oppData = {
    id: String((opportunity as Record<string, unknown>)._id),
    business,
    contact,
    value,
    owner,
    age,
    stage,
    amountReceived: Number((opportunity as Record<string, unknown>).amountReceived || 0),
    serviceLines: ((opportunity as Record<string, unknown>).serviceLines as { serviceName: string; price: number }[] | undefined) ?? [],
  };

  return <AnimatedPage><PageHeader title="Opportunity details" description="Approval, closing, services, payments, and CST routing in one controlled record." /><OpportunityDetail initialOpportunity={oppData} /></AnimatedPage>;
}
