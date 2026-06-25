import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, MoreHorizontal, TrendingUp } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getSessionUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { DailyCallStat } from "@/models/daily-call-stat";
import { activeLeadFilter, leadVisibilityFilter, opportunityVisibilityFilter, visibleUserIdsFor } from "@/lib/pipeline-access";
import { etDayRange } from "@/lib/et-time";

export const metadata = { title: "Dashboard" };

async function loadDashboard() {
  const user = await getSessionUser();
  if (!user) return null;
  await connectToDatabase();

  const now = new Date();
  const today = etDayRange(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const dueFilter = await leadVisibilityFilter(user);
  const opportunityFilter = await opportunityVisibilityFilter(user);
  const visibleIds = await visibleUserIdsFor(user);
  const statFilter = visibleIds ? { agent: { $in: visibleIds } } : {};

  const [totalLeads, dueToday, overdue, approvedThisMonth, wonThisMonth, lostThisMonth, revenueResult, stats, topNiches, topServices] = await Promise.all([
    Lead.countDocuments({ ...dueFilter, ...activeLeadFilter }),
    Lead.countDocuments({ ...dueFilter, reachBackDate: { $gte: today.start, $lte: today.end }, ...activeLeadFilter }),
    Lead.countDocuments({ ...dueFilter, reachBackDate: { $lt: today.start }, ...activeLeadFilter }),
    Opportunity.countDocuments({ ...opportunityFilter, stage: { $in: ["APPROVED", "APPROVED_WON", "CLOSED_WON"] } }),
    Opportunity.countDocuments({ ...opportunityFilter, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] }, dateClosedWon: { $gte: monthStart } }),
    Opportunity.countDocuments({ ...opportunityFilter, stage: { $in: ["APPROVED_LOST", "CLOSED_LOST"] }, dateClosedLost: { $gte: monthStart } }),
    Opportunity.aggregate([{ $match: { ...opportunityFilter, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } } }, { $group: { _id: null, total: { $sum: "$totalDealValue" } } }]),
    DailyCallStat.aggregate([{ $match: { ...statFilter, date: { $gte: today.start, $lte: today.end }, offDay: false } }, { $group: { _id: null, callsMade: { $sum: "$callsMade" }, connected: { $sum: "$connected" } } }]),
    Opportunity.aggregate([{ $match: { ...opportunityFilter, stage: { $in: ["APPROVED", "APPROVED_WON", "CLOSED_WON"] } } }, { $lookup: { from: "leads", localField: "lead", foreignField: "_id", as: "lead" } }, { $unwind: "$lead" }, { $group: { _id: "$lead.niche", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    Opportunity.aggregate([{ $match: { ...opportunityFilter, stage: { $in: ["APPROVED", "APPROVED_WON", "CLOSED_WON"] } } }, { $unwind: "$serviceLines" }, { $group: { _id: "$serviceLines.serviceName", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
  ]);

  const revenueCollected = revenueResult[0]?.total ?? 0;
  const callsMade = stats[0]?.callsMade ?? 0;
  const connected = stats[0]?.connected ?? 0;
  const connectRate = callsMade > 0 ? Math.round((connected / callsMade) * 100) : 0;
  const submitted = await Opportunity.countDocuments({});
  const approvalRate = submitted > 0 && approvedThisMonth > 0 ? Math.round((approvedThisMonth / submitted) * 100) : 0;

  return {
    user,
    totalLeads,
    dueToday,
    overdue,
    approvedThisMonth,
    wonThisMonth,
    lostThisMonth,
    revenueCollected,
    callsMade,
    connected,
    connectRate,
    approvalRate,
    topNiches,
    topServices,
  };
}

export default async function DashboardPage() {
  const data = await loadDashboard();
  if (!data) return null;

  const { user, totalLeads, dueToday, overdue, approvedThisMonth, wonThisMonth, revenueCollected, connectRate, topNiches, topServices } = data;

  const liveMetrics = [
    { label: "Active leads", value: totalLeads.toLocaleString(), change: `${dueToday} due today`, trend: "up" as const, tone: "primary" as const },
    { label: "Follow-ups due", value: String(dueToday + overdue), change: `${overdue} overdue`, trend: "alert" as const, tone: "amber" as const },
    { label: "Closed won", value: String(wonThisMonth), change: `${approvedThisMonth} approved this month`, trend: "up" as const, tone: "emerald" as const },
    { label: "Connect rate", value: `${connectRate}%`, change: "Today's activity", trend: "up" as const, tone: "violet" as const },
  ];

  const livePipeline = [
    { stage: "Submitted", count: totalLeads, value: `$${revenueCollected.toLocaleString()}`, percent: Math.min(Math.round((approvedThisMonth / Math.max(totalLeads, 1)) * 100), 100) },
    { stage: "Approved", count: approvedThisMonth, value: `$${revenueCollected.toLocaleString()}`, percent: Math.min(Math.round((wonThisMonth / Math.max(approvedThisMonth, 1)) * 100), 100) },
    { stage: "In progress", count: approvedThisMonth - wonThisMonth, value: "Active", percent: Math.min(Math.round(((approvedThisMonth - wonThisMonth) / Math.max(approvedThisMonth, 1)) * 100), 100) },
    { stage: "Closed won", count: wonThisMonth, value: `$${revenueCollected.toLocaleString()}`, percent: 100 },
  ];

  return (
    <AnimatedPage>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader title={`Good morning, ${user.name}`} description="Here is what is happening across sales today." />
        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<Link href="/reports" />} variant="outline"><CalendarDays /> View reports</Button>
          <Button nativeButton={false} render={<Link href="/api/dashboard/export" />}><TrendingUp /> Export report</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {liveMetrics.map((item, index) => <MetricCard key={item.label} item={item} index={index} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Revenue velocity</CardTitle><CardDescription>Collected revenue across the selected period</CardDescription></div>
            <Badge variant="secondary">${revenueCollected.toLocaleString()}</Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-end justify-between">
              <div><p className="text-3xl font-semibold">${revenueCollected.toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Approved-Won revenue</p></div>
              <div className="text-right"><p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">+{wonThisMonth}</p><p className="text-xs text-muted-foreground">closed this month</p></div>
            </div>
            <div className="relative h-52 overflow-hidden rounded-xl border bg-muted/25 p-4">
              <div className="absolute inset-0 surface-grid opacity-70" />
              <div className="relative flex h-full items-center justify-center text-sm text-muted-foreground">Revenue chart — {totalLeads} active leads in pipeline</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader><CardTitle>Pipeline health</CardTitle><CardDescription>Conversion from submission to win</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {livePipeline.map((item, index) => (
              <div key={item.stage}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-md bg-muted font-mono text-[10px]">{index + 1}</span><span>{item.stage}</span></div>
                  <div className="text-right"><span className="font-medium">{item.count}</span><span className="ml-2 text-xs text-muted-foreground">{item.value}</span></div>
                </div>
                <Progress value={item.percent} className="h-1.5" />
              </div>
            ))}
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" /> Pipeline active</div>
              <p className="mt-1 text-xs text-muted-foreground">{dueToday} follow-ups due today, {overdue} overdue.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/90">
          <CardHeader><CardTitle>Top niches</CardTitle><CardDescription>Approved appointment count</CardDescription></CardHeader>
          <CardContent className="space-y-3">{topNiches.length ? topNiches.map((item) => <div key={String(item._id || "Unknown")} className="flex justify-between rounded-xl border p-3 text-sm"><span>{String(item._id || "Unknown")}</span><strong>{item.count}</strong></div>) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No approved niches yet</div>}</CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardHeader><CardTitle>Top services</CardTitle><CardDescription>Approved appointment count</CardDescription></CardHeader>
          <CardContent className="space-y-3">{topServices.length ? topServices.map((item) => <div key={String(item._id || "Unknown")} className="flex justify-between rounded-xl border p-3 text-sm"><span>{String(item._id || "Unknown")}</span><strong>{item.count}</strong></div>) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No approved services yet</div>}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Priority follow-ups</CardTitle><CardDescription>Due and overdue leads appear first</CardDescription></div>
            <Button variant="ghost" nativeButton={false} render={<Link href="/follow-ups" />}>View queue <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <p><strong>{dueToday}</strong> due today · <strong>{overdue}</strong> overdue</p>
            <p className="mt-2 text-xs">Visit the <Link href="/follow-ups" className="text-primary hover:underline">Follow-ups page</Link> for detailed queue.</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader><CardTitle>Today&apos;s activity</CardTitle><CardDescription>Current stats for your scope</CardDescription></CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-muted/60 p-3"><CircleDollarSign className="size-4 text-primary" /><p className="mt-2 text-lg font-semibold">${revenueCollected.toLocaleString()}</p><p className="text-[11px] text-muted-foreground">Revenue</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><Clock3 className="size-4 text-primary" /><p className="mt-2 text-lg font-semibold">{wonThisMonth}</p><p className="text-[11px] text-muted-foreground">Closed this month</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
