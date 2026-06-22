import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { HandoffBoard } from "@/components/handoffs/handoff-board";

export const metadata = { title: "CST Handoffs" };

export default function HandoffsPage() {
  return <AnimatedPage><PageHeader title="CST handoffs" description="Monitor every fully-paid client transfer and handler assignment." /><HandoffBoard /></AnimatedPage>;
}
