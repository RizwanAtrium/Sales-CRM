import Link from "next/link";
import { CircleDollarSign, CreditCard, Landmark, MoreHorizontal, WalletCards } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { payments } from "@/lib/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const metadata = { title: "Payments" };

export default function PaymentsPage() {
  return (
    <AnimatedPage>
      <PageHeader title="Payments and revenue" description="Track incremental payments, outstanding balances, and CST handoff eligibility." action="Record payment" actionHref="/payments/new" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Collected", value: "$84,320", note: "This month", icon: CircleDollarSign },
          { label: "Outstanding", value: "$21,460", note: "Across 9 deals", icon: WalletCards },
          { label: "Paid in full", value: "18", note: "Ready for CST", icon: Landmark },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.note}</p></div></CardContent></Card>)}
      </div>
      <Card className="overflow-hidden bg-card/90"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Client / payment</TableHead><TableHead>Deal value</TableHead><TableHead>Received</TableHead><TableHead>Outstanding</TableHead><TableHead className="w-56">Progress</TableHead><TableHead>Status</TableHead><TableHead className="pr-6" /></TableRow></TableHeader><TableBody>
        {payments.map((payment) => {
          const percent = payment.status.includes("59") ? 59 : payment.status.includes("32") ? 32 : payment.status === "Paid in full" ? 100 : 0;
          return <TableRow key={payment.invoice} className="h-20"><TableCell className="pl-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-muted"><CreditCard className="size-4" /></span><div><Link href={`/payments/${payment.invoice}`} className="font-medium hover:text-primary">{payment.client}</Link><p className="text-xs text-muted-foreground">{payment.invoice} · {payment.date}</p></div></div></TableCell><TableCell className="font-mono text-sm">{payment.total}</TableCell><TableCell className="font-mono text-sm text-emerald-600 dark:text-emerald-400">{payment.received}</TableCell><TableCell className="font-mono text-sm">{payment.outstanding}</TableCell><TableCell><div className="flex items-center gap-3"><Progress value={percent} className="h-1.5" /><span className="w-8 font-mono text-xs text-muted-foreground">{percent}%</span></div></TableCell><TableCell><Badge variant={payment.status === "Paid in full" ? "default" : payment.status === "Unpaid" ? "destructive" : "secondary"}>{payment.status}</Badge></TableCell><TableCell className="pr-6"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${payment.client} payment actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/payments/${payment.invoice}`} />}>View payment</DropdownMenuItem><DropdownMenuItem render={<Link href="/payments/new" />}>Record installment</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>;
        })}
      </TableBody></Table></CardContent></Card>
    </AnimatedPage>
  );
}
