import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { NewOpportunityForm } from "@/components/pipeline/new-opportunity-form";

export const metadata = { title: "Submit Appointment" };

export default function NewOpportunityPage() {
  return <AnimatedPage><PageHeader title="Submit appointment" description="Send a qualified lead into the controlled approval and closing pipeline." /><NewOpportunityForm /></AnimatedPage>;
}
