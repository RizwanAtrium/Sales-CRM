import Link from "next/link";
import { Clock3, MoreHorizontal, UserRoundCheck } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { connectToDatabase } from "@/lib/mongodb";
import { requireActiveUser } from "@/lib/require-user";
import { opportunityVisibilityFilter, rolePipelineStages } from "@/lib/pipeline-access";
import { roleLabels } from "@/lib/roles";
import { Opportunity } from "@/models/opportunity";

export const metadata = { title: "Pipeline" };

const stageConfig: Record<string, { name: string; dot: string }> = {
  SUBMITTED: { name: "Submitted", dot: "bg-sky-500" },
  IN_PROGRESS: { name: "In Progress", dot: "bg-amber-500" },
  REJECTED: { name: "Rejected", dot: "bg-rose-500" },
  REVERSED: { name: "Reversed", dot: "bg-orange-500" },
  APPROVED: { name: "Approved", dot: "bg-indigo-500" },
  APPROVED_WON: { name: "Approved-Won", dot: "bg-emerald-500" },
  APPROVED_LOST: { name: "Approved-Lost", dot: "bg-neutral-500" },
};

type Search = { view?: string; mine?: string };

function money(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function objectName(value: unknown, fallback = "Unassigned") {
  if (!value || typeof value !== "object") return fallback;
  return String((value as { name?: string }).name ?? fallback);
}

function ageLabel(date?: Date | string | null) {
  if (!date) return "0d";
  const ms = Date.now() - new Date(date).getTime();
  return `${Math.max(0, Math.ceil(ms / 86400000))}d`;
}

async function loadOpportunities(search: Search) {
  const user = await requireActiveUser();
  if (!user) return [];
  const filter = await opportunityVisibilityFilter(user);
  const records = await Opportunity.find(filter)
    .sort({ dateSubmitted: -1 })
    .populate("lead", "businessName customerName")
    .populate("setter closer teamLeadSnapshot managerSnapshot", "name role")
    .lean();

  if (!records.length) return [];
  const items = records.map((item) => {
    const lead = item.lead as unknown as { businessName?: string; customerName?: string };
    const stage = String(item.stage);
    return {
      id: String(item._id),
      business: lead?.businessName ?? "Untitled business",
      contact: lead?.customerName ?? "Customer",
      value: money(Number(item.totalDealValue || 0)),
      owner: objectName(item.setter, "Setter unassigned"),
      closer: objectName(item.closer ?? item.teamLeadSnapshot, "Closer unassigned"),
      manager: objectName(item.managerSnapshot, "Manager unassigned"),
      age: ageLabel(item.dateSubmitted as Date),
      stage: stageConfig[stage]?.name ?? stage.replaceAll("_", " "),
      rawStage: stage,
    };
  });
  if (search.mine) return items.filter((item) => item.owner === user.name || item.closer === user.name || item.manager === user.name);
  return items;
}

export default async function PipelinePage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  await connectToDatabase().catch(() => null);
  const user = await requireActiveUser();
  const visible = await loadOpportunities(query);
  const stageKeys = rolePipelineStages(user?.role ?? "SUPER_ADMIN").filter((stage) => stageConfig[stage]);
  const total = visible.reduce((sum, item) => sum + Number(item.value.replace(/[$,]/g, "") || 0), 0);

  return (
    <AnimatedPage>
      <PageHeader title="Sales pipeline" description="Move approved opportunities through closing while preserving every stage date." action="Submit appointment" actionHref="/pipeline/new" />
      <div className="flex flex-wrap items-center gap-2">
        <Button nativeButton={false} render={<Link href="/pipeline" />} variant={query.view !== "list" ? "secondary" : "outline"}>Board</Button>
        <Button nativeButton={false} render={<Link href="/pipeline?view=list" />} variant={query.view === "list" ? "secondary" : "outline"}>List</Button>
        <Button nativeButton={false} render={<Link href="/pipeline?mine=true" />} variant={query.mine ? "secondary" : "outline"}>My opportunities</Button>
        <Badge variant="outline" className="ml-auto">{roleLabels[user?.role ?? "SUPER_ADMIN"]} view · Total pipeline · {money(total)}</Badge>
      </div>
      {query.view === "list" ? (
        <Card className="overflow-hidden bg-card/90"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Opportunity</TableHead><TableHead>Stage</TableHead><TableHead>Agent / Setter</TableHead><TableHead>Team Lead / Closer</TableHead><TableHead>Manager</TableHead><TableHead>Age</TableHead><TableHead>Value</TableHead></TableRow></TableHeader><TableBody>{visible.map((item) => <TableRow key={item.id}><TableCell className="pl-6"><Link href={`/pipeline/${item.id}`} className="font-medium hover:text-primary">{item.business}</Link><p className="text-xs text-muted-foreground">{item.contact} · {item.id}</p></TableCell><TableCell><Badge>{item.stage}</Badge></TableCell><TableCell>{item.owner}</TableCell><TableCell>{item.closer}</TableCell><TableCell>{item.manager}</TableCell><TableCell>{item.age}</TableCell><TableCell className="font-mono">{item.value}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {stageKeys.map((stageKey) => {
            const stage = stageConfig[stageKey];
            const cards = visible.filter((item) => item.rawStage === stageKey || item.stage === stage.name);
            const stageTotal = cards.reduce((sum, item) => sum + Number(item.value.replace(/[$,]/g, "") || 0), 0);
            return (
              <div key={stage.name} className="min-w-0 rounded-2xl bg-muted/35 p-3">
                <div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${stage.dot}`} /><h2 className="text-sm font-semibold">{stage.name}</h2><Badge variant="secondary" className="font-mono">{cards.length}</Badge></div><span className="font-mono text-xs text-muted-foreground">{money(stageTotal)}</span></div>
                <div className="space-y-3">
                  {cards.map((item) => (
                    <Card key={item.id} className="group bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                      <CardHeader className="p-4 pb-2"><div className="flex items-start justify-between"><div><CardTitle className="text-sm"><Link href={`/pipeline/${item.id}`} className="hover:text-primary">{item.business}</Link></CardTitle><p className="mt-1 text-xs text-muted-foreground">{item.contact} · {item.id}</p></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Open ${item.business} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/pipeline/${item.id}`} />}>View details</DropdownMenuItem><DropdownMenuItem render={<Link href={`/pipeline/${item.id}?action=stage`} />}>Update stage</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></CardHeader>
                      <CardContent className="p-4 pt-2"><p className="font-mono text-lg font-semibold">{item.value}</p><div className="mt-4 space-y-1 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><UserRoundCheck className="size-3" />Agent: {item.owner}</span><span className="flex items-center gap-1"><UserRoundCheck className="size-3" />Closer: {item.closer}</span><span className="flex items-center gap-1"><Clock3 className="size-3" />{item.age}</span></div></CardContent>
                    </Card>
                  ))}
                  {cards.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">No opportunities</div> : null}
                  <Button nativeButton={false} render={<Link href="/pipeline/new" />} variant="ghost" className="w-full border border-dashed text-muted-foreground">+ Add opportunity</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}
