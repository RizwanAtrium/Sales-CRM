import { notFound } from "next/navigation";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { OpportunityDetail } from "@/components/pipeline/opportunity-detail";
import { opportunities } from "@/lib/demo-data";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = opportunities.find((item) => item.id === id);
  const fallback = source ?? (/^[0-9a-f]{24}$/i.test(id) || id.startsWith("OP-") ? { ...opportunities[0], id } : null);
  if (!fallback) notFound();
  return <AnimatedPage><PageHeader title="Opportunity details" description="Approval, closing, services, payments, and CST routing in one controlled record." /><OpportunityDetail initialOpportunity={fallback} /></AnimatedPage>;
}
