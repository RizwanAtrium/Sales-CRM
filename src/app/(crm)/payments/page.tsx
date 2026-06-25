import Link from "next/link";
import { CircleDollarSign, CreditCard, Landmark, MoreHorizontal, WalletCards } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { Opportunity } from "@/models/opportunity";
import { opportunityVisibilityFilter } from "@/lib/pipeline-access";

export const metadata = { title: "Payments" };

async function loadPayments() {
  const user = await requireActiveUser();
  if (!user) return null;
  await connectToDatabase();

  const filter = await opportunityVisibilityFilter(user);
  const won = await Opportunity.find({ ...filter, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } })
    .populate("lead", "businessName customerName")
    .populate("setter closer", "name")
    .sort({ dateClosedWon: -1 })
    .lean();

  const collected = won.reduce((sum, item) => sum + (item.amountReceived || 0), 0);
  const outstanding = won.reduce((sum, item) => sum + ((item.totalDealValue || 0) - (item.amountReceived || 0)), 0);
  const paidInFull = won.filter((item) => (item.amountReceived || 0) >= (item.totalDealValue || 0)).length;

  const paymentList = won.map((item) => {
    const lead = item.lead as { businessName?: string; customerName?: string } | undefined;
    const dealValue = item.totalDealValue || 0;
    const received = item.amountReceived || 0;
    const rest = dealValue - received;
    const percent = dealValue > 0 ? Math.round((received / dealValue) * 100) : 0;
    const status = received >= dealValue ? "Paid in full" : received > 0 ? `Partial · ${percent}%` : "Unpaid";
    const date = item.dateClosedWon ? new Date(item.dateClosedWon).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "-";
    return {
      id: String(item._id).slice(-6).toUpperCase(),
      opportunityId: String(item._id),
      client: lead?.businessName ?? "Deal",
      invoice: `PAY-${String(item._id).slice(-6).toUpperCase()}`,
      total: `$${dealValue.toLocaleString()}`,
      received: `$${received.toLocaleString()}`,
      outstanding: `$${rest.toLocaleString()}`,
      percent,
      status,
      date,
    };
  });

  return { collected, outstanding, paidInFull, paymentList };
}

export default async function PaymentsPage() {
  const data = await loadPayments();
  if (!data) return null;

  return (
    <AnimatedPage>
      <PageHeader title="Payments and revenue" description="Track incremental payments, outstanding balances, and CST handoff eligibility." action="Record payment" actionHref="/payments/new" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Collected", value: `$${data.collected.toLocaleString()}`, note: "Across all won deals", icon: CircleDollarSign },
          { label: "Outstanding", value: `$${data.outstanding.toLocaleString()}`, note: `Across ${data.paymentList.length} deals`, icon: WalletCards },
          { label: "Paid in full", value: String(data.paidInFull), note: "Ready for CST", icon: Landmark },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.note}</p></div></CardContent></Card>)}
      </div>
      <Card className="overflow-hidden bg-card/90"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Client / payment</TableHead><TableHead>Deal value</TableHead><TableHead>Received</TableHead><TableHead>Outstanding</TableHead><TableHead className="w-56">Progress</TableHead><TableHead>Status</TableHead><TableHead className="pr-6" /></TableRow></TableHeader><TableBody>
        {data.paymentList.map((payment) => (
          <TableRow key={payment.invoice} className="h-20"><TableCell className="pl-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-muted"><CreditCard className="size-4" /></span><div><Link href={`/payments/${payment.opportunityId}`} className="font-medium hover:text-primary">{payment.client}</Link><p className="text-xs text-muted-foreground">{payment.invoice} · {payment.date}</p></div></div></TableCell><TableCell className="font-mono text-sm">{payment.total}</TableCell><TableCell className="font-mono text-sm text-emerald-600 dark:text-emerald-400">{payment.received}</TableCell><TableCell className="font-mono text-sm">{payment.outstanding}</TableCell><TableCell><div className="flex items-center gap-3"><Progress value={payment.percent} className="h-1.5" /><span className="w-8 font-mono text-xs text-muted-foreground">{payment.percent}%</span></div></TableCell><TableCell><Badge variant={payment.status === "Paid in full" ? "default" : payment.status === "Unpaid" ? "destructive" : "secondary"}>{payment.status}</Badge></TableCell><TableCell className="pr-6"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${payment.client} payment actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href="/payments/new" />}>Record installment</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>
        ))}
      </TableBody></Table></CardContent></Card>
    </AnimatedPage>
  );
}
