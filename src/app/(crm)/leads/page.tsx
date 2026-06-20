import Link from "next/link";
import { Download, Filter, MoreHorizontal, Search, Users } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { leads } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const metadata = { title: "Leads" };

const badgeVariant = (stage: string) => stage === "Closed Won" ? "default" : stage === "Follow-up" ? "destructive" : "secondary";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ search?: string; stage?: string; agent?: string }> }) {
  const query = await searchParams;
  const visibleLeads = leads.filter((lead) => {
    const matchesSearch = !query.search || `${lead.customer} ${lead.business} ${lead.id}`.toLowerCase().includes(query.search.toLowerCase());
    const matchesStage = !query.stage || lead.stage === query.stage;
    const matchesAgent = !query.agent || lead.agent === query.agent;
    return matchesSearch && matchesStage && matchesAgent;
  });

  return (
    <AnimatedPage>
      <PageHeader title="Lead management" description="Capture, assign, search, and track every prospect through the follow-up cycle." action="New lead" actionHref="/leads/new" />
      <div className="flex flex-col gap-3 rounded-xl border bg-card/90 p-4 lg:flex-row lg:items-center">
        <form className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="search" defaultValue={query.search} className="pl-9" placeholder="Search by customer, business, phone, or email..." /></form>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}><Filter /> Filters</DropdownMenuTrigger><DropdownMenuContent>{["New", "Follow-up", "Submitted", "Approved", "In Progress", "Closed Won"].map((stage) => <DropdownMenuItem key={stage} render={<Link href={`/leads?stage=${encodeURIComponent(stage)}`} />}>{stage}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}><Users /> All agents</DropdownMenuTrigger><DropdownMenuContent>{["Uzma Khan", "Haroon Ali", "Rohan Malik"].map((agent) => <DropdownMenuItem key={agent} render={<Link href={`/leads?agent=${encodeURIComponent(agent)}`} />}>{agent}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
          <Button nativeButton={false} render={<Link href="/api/leads/export" />} variant="outline"><Download /> Export</Button>
        </div>
      </div>
      <Card className="overflow-hidden bg-card/90">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead className="pl-6">Lead</TableHead><TableHead>Source</TableHead><TableHead>Assigned agent</TableHead><TableHead>Next callback</TableHead><TableHead>Stage</TableHead><TableHead>Value</TableHead><TableHead className="pr-6 text-right" /></TableRow></TableHeader>
            <TableBody>
              {visibleLeads.map((lead) => (
                <TableRow key={lead.id} className="h-16">
                  <TableCell className="pl-6"><Link href={`/leads/${lead.id}`} className="font-medium hover:text-primary">{lead.business}</Link><p className="text-xs text-muted-foreground">{lead.customer} · {lead.id}</p></TableCell>
                  <TableCell><Badge variant="outline">{lead.source}</Badge></TableCell>
                  <TableCell className="text-sm">{lead.agent}</TableCell>
                  <TableCell className={lead.callback === "Yesterday" ? "font-medium text-amber-600 dark:text-amber-400" : "text-sm"}>{lead.callback}</TableCell>
                  <TableCell><Badge variant={badgeVariant(lead.stage)}>{lead.stage}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{lead.value}</TableCell>
                  <TableCell className="pr-6 text-right"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${lead.business} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/leads/${lead.id}`} />}>View details</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads/${lead.id}?action=follow-up`} />}>Log follow-up</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads/${lead.id}?action=edit`} />}>Edit lead</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-6 py-4 text-xs text-muted-foreground"><span>Showing {visibleLeads.length} matching leads</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled>Previous</Button><Button variant="outline" size="sm" disabled>Next</Button></div></div>
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}
