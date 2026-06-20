import { notFound } from "next/navigation";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { LeadDetail } from "@/components/leads/lead-detail";
import { leads } from "@/lib/demo-data";

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ action?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const source = leads.find((lead) => lead.id === id);
  const fallback = source ?? (/^[0-9a-f]{24}$/i.test(id) || id.startsWith("LD-") ? { ...leads[0], id } : null);
  if (!fallback) notFound();
  return <AnimatedPage><PageHeader title="Lead details" description="Contact data, follow-up history, ownership, and appointment submission." /><LeadDetail initialLead={{ ...fallback, phone: "+1 555 014 2084", email: "customer@example.com" }} initialAction={query.action} /></AnimatedPage>;
}
