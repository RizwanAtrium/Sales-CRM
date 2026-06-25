import Link from "next/link";
import { Download, Filter, MoreHorizontal, Search, Users } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/lead";
import { leadVisibilityFilter } from "@/lib/pipeline-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const metadata = { title: "Leads" };

const stageAlias: Record<string, string> = {
  ACTIVE: "New",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVERSED: "Reversed",
  IN_PROGRESS: "In Progress",
  APPROVED_WON: "Closed Won",
  APPROVED_LOST: "Closed Lost",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
  NOT_INTERESTED: "Not Interested",
  ARCHIVED: "Archived",
};

const badgeVariant = (stage: string) => stage === "Closed Won" ? "default" : stage === "Follow-up" || stage === "Overdue" || stage === "Not Interested" ? "destructive" : "secondary";

function formatMoney(value: number) {
  return value ? `$${value.toLocaleString()}` : "-";
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ search?: string; stage?: string; agent?: string; closer?: string }> }) {
  const query = await searchParams;
  const user = await requireActiveUser();
  
  await connectToDatabase();
  if (!user) return null;
  const filter: Record<string, unknown> = await leadVisibilityFilter(user);
  
  const leads = await Lead.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("assignedAgent assignedTeamLead", "name")
    .lean();
  
  const visibleLeads = leads.filter((lead) => {
    const stage = stageAlias[String(lead.status)] ?? String(lead.status);
    const business = String(lead.businessName);
    const customer = String(lead.customerName);
    const leadId = String(lead._id);
    const agentName = (lead.assignedAgent as { name?: string } | undefined)?.name ?? "";
    const closerName = (lead.assignedTeamLead as { name?: string } | undefined)?.name ?? "";
    const matchesSearch = !query.search || `${customer} ${business} ${leadId} ${lead.phoneNumber ?? ""} ${lead.email ?? ""}`.toLowerCase().includes(query.search.toLowerCase());
    const matchesStage = !query.stage || stage === query.stage;
    const matchesAgent = !query.agent || agentName === query.agent;
    const matchesCloser = !query.closer || closerName === query.closer;
    return matchesSearch && matchesStage && matchesAgent && matchesCloser;
  });

  const allAgents = Array.from(new Set(leads.map((lead) => (lead.assignedAgent as { name?: string } | undefined)?.name ?? "").filter(Boolean)));
  const allClosers = Array.from(new Set(leads.map((lead) => (lead.assignedTeamLead as { name?: string } | undefined)?.name ?? "").filter(Boolean)));

  return (
    <AnimatedPage>
      <PageHeader title="Lead management" description="Capture, assign, search, and track every prospect through the follow-up cycle." action="New lead" actionHref="/leads/new" />
      <div className="flex flex-col gap-3 rounded-xl border bg-card/90 p-4 lg:flex-row lg:items-center">
        <form className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="search" defaultValue={query.search} className="pl-9" placeholder="Search by customer, business, phone, or email..." /></form>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}><Filter /> Filters</DropdownMenuTrigger><DropdownMenuContent>{["New", "Follow-up", "Submitted", "Approved", "In Progress", "Closed Won"].map((stage) => <DropdownMenuItem key={stage} render={<Link href={`/leads?stage=${encodeURIComponent(stage)}`} />}>{stage}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
          {allAgents.length > 0 ? <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}><Users /> All agents</DropdownMenuTrigger><DropdownMenuContent>{allAgents.map((agent) => <DropdownMenuItem key={agent} render={<Link href={`/leads?agent=${encodeURIComponent(agent)}`} />}>{agent}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu> : null}
          {allClosers.length > 0 ? <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}><Users /> Team Lead / Closer</DropdownMenuTrigger><DropdownMenuContent>{allClosers.map((closer) => <DropdownMenuItem key={closer} render={<Link href={`/leads?closer=${encodeURIComponent(closer)}`} />}>{closer}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu> : null}
          <Button nativeButton={false} render={<Link href="/api/leads/export" />} variant="outline"><Download /> Export</Button>
        </div>
      </div>
      <Card className="overflow-hidden bg-card/90">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead className="pl-6">Lead</TableHead><TableHead>Source</TableHead><TableHead>Assigned agent</TableHead><TableHead>Team Lead / Closer</TableHead><TableHead>Next callback</TableHead><TableHead>Stage</TableHead><TableHead>Value</TableHead><TableHead className="pr-6 text-right" /></TableRow></TableHeader>
            <TableBody>
              {visibleLeads.map((lead) => {
                const stage = stageAlias[String(lead.status)] ?? String(lead.status);
                const agent = (lead.assignedAgent as { name?: string } | undefined)?.name ?? "Unassigned";
                const closer = (lead.assignedTeamLead as { name?: string } | undefined)?.name ?? "-";
                const callback = lead.reachBackDate ? new Date(lead.reachBackDate).toLocaleString("en-US", { timeZone: "America/New_York" }) : "-";
                const value = formatMoney(Number(lead.price ?? 0));
                return (
                  <TableRow key={String(lead._id)} className="h-16">
                    <TableCell className="pl-6"><Link href={`/leads/${String(lead._id)}`} className="font-medium hover:text-primary">{lead.businessName}</Link><p className="text-xs text-muted-foreground">{lead.customerName} · {String(lead._id).slice(-6)}</p></TableCell>
                    <TableCell><Badge variant="outline">{lead.leadSource}</Badge></TableCell>
                    <TableCell className="text-sm">{agent}</TableCell>
                    <TableCell className="text-sm">{closer}</TableCell>
                    <TableCell className="text-sm">{callback}</TableCell>
                    <TableCell><Badge variant={badgeVariant(stage)}>{stage}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{value}</TableCell>
                    <TableCell className="pr-6 text-right"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${lead.businessName} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/leads/${String(lead._id)}`} />}>View details</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads/${String(lead._id)}?action=follow-up`} />}>Log follow-up</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads/${String(lead._id)}?action=edit`} />}>Edit lead</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-6 py-4 text-xs text-muted-foreground"><span>Showing {visibleLeads.length} matching leads</span></div>
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}
