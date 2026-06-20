import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3, MessageSquareText, Phone, Search } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { followUps } from "@/lib/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata = { title: "Follow-ups" };

export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<{ filter?: string; search?: string }> }) {
  const query = await searchParams;
  const queue = [...followUps, ...followUps.map((item, index) => ({ ...item, id: `${item.id}-${index}`, business: `${item.business} Group`, due: index % 2 ? "Tomorrow" : "2 days ago" }))];
  const visibleQueue = queue.filter((item) => {
    const statusMatch = query.filter !== "overdue" || item.status === "Overdue";
    const todayMatch = query.filter !== "today" || item.status === "Due today";
    const searchMatch = !query.search || `${item.business} ${item.customer}`.toLowerCase().includes(query.search.toLowerCase());
    return statusMatch && todayMatch && searchMatch;
  });

  return (
    <AnimatedPage>
      <PageHeader title="Follow-up queue" description="Every due and overdue lead, automatically prioritized oldest-first." action="Add lead" actionHref="/leads/new" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Due today", value: 26, note: "Across 4 agents", icon: CalendarClock, tone: "text-primary" },
          { label: "Overdue", value: 12, note: "Oldest is 4 days", icon: Clock3, tone: "text-amber-500" },
          { label: "Completed", value: 47, note: "Since this morning", icon: CheckCircle2, tone: "text-emerald-500" },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div><item.icon className={`size-6 ${item.tone}`} /></CardContent></Card>)}
      </div>
      <Card className="bg-card/90">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <form className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="search" defaultValue={query.search} className="pl-9" placeholder="Search queue..." /></form>
            <div className="flex gap-2"><Button nativeButton={false} render={<Link href="/follow-ups" />} variant={!query.filter ? "secondary" : "outline"}>All 38</Button><Button nativeButton={false} render={<Link href="/follow-ups?filter=overdue" />} variant={query.filter === "overdue" ? "secondary" : "outline"}>Overdue 12</Button><Button nativeButton={false} render={<Link href="/follow-ups?filter=today" />} variant={query.filter === "today" ? "secondary" : "outline"}>Today 26</Button></div>
          </div>
          <div className="grid gap-3">
            {visibleQueue.map((item, index) => {
              const leadId = item.id.split("-").slice(0, 2).join("-");
              return (
                <div key={`${item.id}-${index}`} className="group flex flex-col gap-4 rounded-xl border bg-background/55 p-4 transition-all hover:border-primary/30 hover:shadow-sm lg:flex-row lg:items-center">
                  <Avatar className="size-10"><AvatarFallback className="bg-primary/10 text-xs text-primary">{item.customer.split(" ").map((name) => name[0]).join("")}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={`/leads/${leadId}`} className="font-medium hover:text-primary">{item.business}</Link><Badge variant={item.status === "Overdue" ? "destructive" : "secondary"}>{item.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.customer} · {item.source} · {item.id}</p></div>
                  <div className="flex min-w-28 items-center gap-2 text-sm"><Clock3 className="size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Reach back</p><p className="font-medium">{item.due}</p></div></div>
                  <div className="text-sm lg:w-32"><p className="text-xs text-muted-foreground">Assigned to</p><p className="font-medium">{item.agent}</p></div>
                  <div className="flex gap-2"><Button nativeButton={false} render={<a href="tel:+15550142084" />} variant="outline"><Phone /> Call</Button><Button nativeButton={false} render={<Link href={`/leads/${leadId}?action=follow-up`} />}><MessageSquareText /> Log outcome</Button></div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}
