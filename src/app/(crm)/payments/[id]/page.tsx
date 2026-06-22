import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, ReceiptText } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { payments } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = payments.find((item) => item.invoice === id);
  if (!payment) notFound();
  const percent = payment.status.includes("59") ? 59 : payment.status.includes("32") ? 32 : payment.status === "Paid in full" ? 100 : 0;
  return <AnimatedPage><PageHeader title="Payment details" description="Immutable received-payment history and current balance calculation." /><div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><Card className="bg-card/90"><CardHeader><div className="flex items-start justify-between"><div><CardTitle>{payment.client}</CardTitle><CardDescription>{payment.invoice} · {payment.date}</CardDescription></div><Badge>{payment.status}</Badge></div></CardHeader><CardContent className="space-y-6"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Deal value" value={payment.total} /><Metric label="Received" value={payment.received} /><Metric label="Outstanding" value={payment.outstanding} /></div><div><div className="mb-2 flex justify-between text-sm"><span>Collection progress</span><span className="font-mono">{percent}%</span></div><Progress value={percent} className="h-2" /></div><div className="space-y-3"><p className="text-sm font-medium">Payment ledger</p>{percent ? <div className="flex items-center gap-3 rounded-xl border p-4"><span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-4" /></span><div className="flex-1"><p className="text-sm font-medium">Payment received</p><p className="text-xs text-muted-foreground">{payment.date} · entered by Haroon Ali</p></div><p className="font-mono font-semibold">{payment.received}</p></div> : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No payments received yet</div>}</div></CardContent></Card><div className="space-y-4"><Card className="bg-card/90"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4 text-primary" /> Next action</CardTitle></CardHeader><CardContent className="space-y-3"><Button nativeButton={false} render={<Link href="/payments/new" />} className="w-full"><CreditCard /> Record another payment</Button><Button nativeButton={false} render={<Link href="/pipeline/OP-452" />} variant="outline" className="w-full">Open deal <ArrowRight /></Button></CardContent></Card><Card className="border-primary/15 bg-primary/[0.04]"><CardContent className="p-5 text-xs leading-5 text-muted-foreground">Paid-in-Full automatically stamps Date Paid and makes a Closed-Won client eligible for CST handoff.</CardContent></Card></div></div></AnimatedPage>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-mono text-xl font-semibold">{value}</p></div>;
}
