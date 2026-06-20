import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { NewPaymentForm } from "@/components/payments/new-payment-form";

export const metadata = { title: "Record Payment" };

export default function NewPaymentPage() {
  return <AnimatedPage><PageHeader title="Record payment" description="Add a dated payment entry without overwriting prior ledger history." /><NewPaymentForm /></AnimatedPage>;
}
