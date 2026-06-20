import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { ApprovalQueue } from "@/components/approvals/approval-queue";

export const metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return <AnimatedPage><PageHeader title="Approval center" description="Review appointments and controlled removal requests without losing historical data." /><ApprovalQueue /></AnimatedPage>;
}
