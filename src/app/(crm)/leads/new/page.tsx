import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { NewLeadForm } from "@/components/leads/new-lead-form";

export const metadata = { title: "New Lead" };

export default function NewLeadPage() {
  return <AnimatedPage><PageHeader title="Create a lead" description="Start a traceable follow-up cycle with complete contact and callback information." /><NewLeadForm /></AnimatedPage>;
}
