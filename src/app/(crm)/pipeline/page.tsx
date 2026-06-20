import Link from "next/link";
import { Clock3, MoreHorizontal, UserRoundCheck } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { opportunities } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Pipeline" };

const stages = [
  { name: "Submitted", value: "$8.3k", dot: "bg-sky-500" },
  { name: "Approved", value: "$8.2k", dot: "bg-indigo-500" },
  { name: "In Progress", value: "$6.1k", dot: "bg-amber-500" },
  { name: "Closed Won", value: "$12.4k", dot: "bg-emerald-500" },
];

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ view?: string; mine?: string }> }) {
  const query = await searchParams;
  const visible = query.mine ? opportunities.filter((item) => item.owner === "Haroon Ali") : opportunities;
  return (
    <AnimatedPage>
      <PageHeader title="Sales pipeline" description="Move approved opportunities through closing while preserving every stage date." action="Submit appointment" actionHref="/pipeline/new" />
      <div className="flex flex-wrap items-center gap-2"><Button nativeButton={false} render={<Link href="/pipeline" />} variant={query.view !== "list" ? "secondary" : "outline"}>Board</Button><Button nativeButton={false} render={<Link href="/pipeline?view=list" />} variant={query.view === "list" ? "secondary" : "outline"}>List</Button><Button nativeButton={false} render={<Link href="/pipeline?mine=true" />} variant={query.mine ? "secondary" : "outline"}>My opportunities</Button><Badge variant="outline" className="ml-auto">Total pipeline · $35,000</Badge></div>
      {query.view === "list" ? (
        <Card className="overflow-hidden bg-card/90"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Opportunity</TableHead><TableHead>Stage</TableHead><TableHead>Owner</TableHead><TableHead>Age</TableHead><TableHead>Value</TableHead></TableRow></TableHeader><TableBody>{visible.map((item) => <TableRow key={item.id}><TableCell className="pl-6"><Link href={`/pipeline/${item.id}`} className="font-medium hover:text-primary">{item.business}</Link><p className="text-xs text-muted-foreground">{item.contact} · {item.id}</p></TableCell><TableCell><Badge>{item.stage}</Badge></TableCell><TableCell>{item.owner}</TableCell><TableCell>{item.age}</TableCell><TableCell className="font-mono">{item.value}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {stages.map((stage) => {
            const cards = visible.filter((item) => item.stage === stage.name);
            return (
              <div key={stage.name} className="min-w-0 rounded-2xl bg-muted/35 p-3">
                <div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${stage.dot}`} /><h2 className="text-sm font-semibold">{stage.name}</h2><Badge variant="secondary" className="font-mono">{cards.length}</Badge></div><span className="font-mono text-xs text-muted-foreground">{stage.value}</span></div>
                <div className="space-y-3">
                  {cards.map((item) => (
                    <Card key={item.id} className="group bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                      <CardHeader className="p-4 pb-2"><div className="flex items-start justify-between"><div><CardTitle className="text-sm"><Link href={`/pipeline/${item.id}`} className="hover:text-primary">{item.business}</Link></CardTitle><p className="mt-1 text-xs text-muted-foreground">{item.contact} · {item.id}</p></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Open ${item.business} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/pipeline/${item.id}`} />}>View details</DropdownMenuItem><DropdownMenuItem render={<Link href={`/pipeline/${item.id}?action=stage`} />}>Update stage</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></CardHeader>
                      <CardContent className="p-4 pt-2"><p className="font-mono text-lg font-semibold">{item.value}</p><div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><UserRoundCheck className="size-3" />{item.owner}</span><span className="flex items-center gap-1"><Clock3 className="size-3" />{item.age}</span></div></CardContent>
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
