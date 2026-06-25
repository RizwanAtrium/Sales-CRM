import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, ReceiptText } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { Opportunity } from "@/models/opportunity";
import { opportunityVisibilityFilter } from "@/lib/pipeline-access";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActiveUser();
  if (!user) return null;
  await connectToDatabase();

  const visibility = await opportunityVisibilityFilter(user);
  const opp = await Opportunity.findOne({ _id: id, ...visibility })
    .populate("lead", "businessName customerName phoneNumber email")
    .populate("setter closer", "name")
    .lean();
  if (!opp) notFound();

  const lead = opp.lead as { businessName?: string; customerName?: string } | undefined;
  const dealValue = opp.totalDealValue || 0;
  const received = opp.amountReceived || 0;
  const rest = dealValue - received;
  const percent = dealValue > 0 ? Math.round((received / dealValue) * 100) : 0;
  const status = received >= dealValue ? "Paid in full" : received > 0 ? `Partial · ${percent}%` : "Unpaid";
  const date = opp.dateClosedWon ? new Date(opp.dateClosedWon).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "-";
  const invoice = `PAY-${String(opp._id).slice(-6).toUpperCase()}`;
  const closerName = (opp.closer as { name?: string } | undefined)?.name ?? "Closer";

  return (
    <AnimatedPage>
      <PageHeader title="Payment details" description="Immutable received-payment history and current balance calculation." />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/90">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{lead?.businessName ?? "Client"}</CardTitle>
                <CardDescription>{invoice} · {date}</CardDescription>
              </div>
              <Badge>{status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Deal value</p><p className="mt-2 font-mono text-xl font-semibold">${dealValue.toLocaleString()}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Received</p><p className="mt-2 font-mono text-xl font-semibold">${received.toLocaleString()}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="mt-2 font-mono text-xl font-semibold">${rest.toLocaleString()}</p></div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Payment ledger</p>
              {received > 0 ? (
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-4" /></span>
                  <div className="flex-1"><p className="text-sm font-medium">Payment received</p><p className="text-xs text-muted-foreground">{date} · entered by {closerName}</p></div>
                  <p className="font-mono font-semibold">${received.toLocaleString()}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No payments received yet</div>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="bg-card/90">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4 text-primary" /> Next action</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button nativeButton={false} render={<Link href="/payments/new" />} className="w-full"><CreditCard /> Record another payment</Button>
              <Button nativeButton={false} render={<Link href={`/pipeline/${id}`} />} variant="outline" className="w-full">Open deal <ArrowRight /></Button>
            </CardContent>
          </Card>
          <Card className="border-primary/15 bg-primary/[0.04]">
            <CardContent className="p-5 text-xs leading-5 text-muted-foreground">
              Paid-in-Full automatically stamps Date Paid and makes a Closed-Won client eligible for CST handoff.
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedPage>
  );
}
