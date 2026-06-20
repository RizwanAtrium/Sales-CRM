import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, MoreHorizontal, TrendingUp } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { metrics, followUps, pipeline, teamPerformance } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <AnimatedPage>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader title="Good morning, Asad" description="Here is what is happening across sales today." />
        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<Link href="/reports" />} variant="outline"><CalendarDays /> Jun 1 – Jun 20</Button>
          <Button nativeButton={false} render={<Link href="/api/dashboard/export" />}><TrendingUp /> Export report</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, index) => <MetricCard key={item.label} item={item} index={index} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Revenue velocity</CardTitle><CardDescription>Collected revenue across the selected period</CardDescription></div>
            <Badge variant="secondary">+$18.4k</Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-end justify-between">
              <div><p className="text-3xl font-semibold">$84,320</p><p className="mt-1 text-xs text-muted-foreground">70% of monthly target</p></div>
              <div className="text-right"><p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">+12.4%</p><p className="text-xs text-muted-foreground">period growth</p></div>
            </div>
            <div className="relative h-52 overflow-hidden rounded-xl border bg-muted/25 p-4">
              <div className="absolute inset-0 surface-grid opacity-70" />
              <svg viewBox="0 0 700 190" className="relative h-full w-full" preserveAspectRatio="none" aria-label="Revenue chart">
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,160 C70,150 85,105 145,125 C205,145 230,70 290,92 C350,115 370,55 430,72 C500,90 510,30 565,48 C620,65 650,18 700,24 L700,190 L0,190 Z" fill="url(#revenueFill)" />
                <path d="M0,160 C70,150 85,105 145,125 C205,145 230,70 290,92 C350,115 370,55 430,72 C500,90 510,30 565,48 C620,65 650,18 700,24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="relative mt-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>Jun 1</span><span>Jun 5</span><span>Jun 10</span><span>Jun 15</span><span>Jun 20</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader><CardTitle>Pipeline health</CardTitle><CardDescription>Conversion from submission to win</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {pipeline.map((item, index) => (
              <div key={item.stage}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-md bg-muted font-mono text-[10px]">{index + 1}</span><span>{item.stage}</span></div>
                  <div className="text-right"><span className="font-medium">{item.count}</span><span className="ml-2 text-xs text-muted-foreground">{item.value}</span></div>
                </div>
                <Progress value={item.percent} className="h-1.5" />
              </div>
            ))}
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" /> Pipeline is up 8.6%</div>
              <p className="mt-1 text-xs text-muted-foreground">Approval-to-close time improved by 1.4 days.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Priority follow-ups</CardTitle><CardDescription>Oldest overdue leads appear first</CardDescription></div>
            <Button variant="ghost" nativeButton={false} render={<Link href="/follow-ups" />}>View queue <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader><TableRow><TableHead className="pl-6">Lead</TableHead><TableHead>Agent</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="pr-6 text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {followUps.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6"><p className="font-medium">{item.business}</p><p className="text-xs text-muted-foreground">{item.customer} · {item.id}</p></TableCell>
                    <TableCell className="text-sm">{item.agent}</TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-xs"><Clock3 className="size-3.5 text-muted-foreground" />{item.due}</div></TableCell>
                    <TableCell><Badge variant={item.status === "Overdue" ? "destructive" : "secondary"}>{item.status}</Badge></TableCell>
                    <TableCell className="pr-6 text-right"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${item.business} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/leads/${item.id}`} />}>View lead</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads/${item.id}?action=follow-up`} />}>Log outcome</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader><CardTitle>Team momentum</CardTitle><CardDescription>Weekly activity against target</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {teamPerformance.map((member) => (
              <div key={member.name} className="flex items-center gap-3">
                <Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-xs text-primary">{member.initials}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><div className="flex justify-between"><p className="truncate text-sm font-medium">{member.name}</p><span className="font-mono text-xs">{member.rate}%</span></div><Progress value={member.rate} className="mt-2 h-1.5" /></div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-muted/60 p-3"><CircleDollarSign className="size-4 text-primary" /><p className="mt-2 text-lg font-semibold">$21.4k</p><p className="text-[11px] text-muted-foreground">Team pipeline</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><Clock3 className="size-4 text-primary" /><p className="mt-2 text-lg font-semibold">2.8 days</p><p className="text-[11px] text-muted-foreground">Avg. approval</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
