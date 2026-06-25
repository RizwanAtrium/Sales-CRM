import Link from "next/link";
import { Download, Filter, LockKeyhole, Search } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditEntry } from "@/models/audit-entry";

export const metadata = { title: "Audit Log" };

async function loadAuditEntries(search?: string, type?: string) {
  const user = await requireActiveUser();
  if (!user) return [];
  await connectToDatabase();
  
  const filter: Record<string, unknown> = {};
  if (type) filter.action = new RegExp(type, "i");
  if (search) filter.$or = [
    { actorName: new RegExp(search, "i") },
    { action: new RegExp(search, "i") },
    { targetId: new RegExp(search, "i") },
  ];
  
  const entries = await AuditEntry.find(filter).sort({ timestamp: -1 }).limit(100).lean();
  return entries.map((entry) => ({
    time: entry.timestamp ? new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }) : "-",
    actor: entry.actorName,
    action: entry.action.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
    target: entry.targetType ? `${entry.targetType} · ${String(entry.targetId).slice(-8)}` : String(entry.targetId).slice(-8),
    type: entry.action?.toLowerCase().includes("payment") ? "payment" : entry.action?.toLowerCase().includes("lead") ? "create" : entry.action?.toLowerCase().includes("edit") ? "edit" : entry.action?.toLowerCase().includes("approv") ? "status" : "user",
  }));
}

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ search?: string; type?: string }> }) {
  const query = await searchParams;
  const rows = await loadAuditEntries(query.search, query.type);
  return (
    <AnimatedPage>
      <PageHeader title="Immutable audit log" description="Append-only history of creates, edits, assignments, approvals, removals, and logins." />
      <div className="rounded-xl border border-primary/15 bg-primary/[0.05] p-4"><div className="flex items-center gap-2 text-sm font-medium"><LockKeyhole className="size-4 text-primary" /> Records are immutable</div><p className="mt-1 text-xs text-muted-foreground">Audit events can be viewed and exported but never edited or deleted.</p></div>
      <Card className="bg-card/90"><CardContent className="p-4"><div className="flex flex-col gap-3 sm:flex-row"><form className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="search" defaultValue={query.search} className="pl-9" placeholder="Search actor, action, or target..." /></form><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}><Filter /> Filter</DropdownMenuTrigger><DropdownMenuContent>{["status", "edit", "payment", "user", "create"].map((type) => <DropdownMenuItem key={type} render={<Link href={`/audit-log?type=${type}`} />}>{type}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu><Button nativeButton={false} render={<Link href="/api/audit/export" />} variant="outline"><Download /> Export</Button></div></CardContent></Card>
      <Card className="overflow-hidden bg-card/90"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Timestamp</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Event type</TableHead></TableRow></TableHeader><TableBody>{rows.map((entry, index) => <TableRow key={`${entry.time}-${index}`} className="h-16"><TableCell className="pl-6 font-mono text-xs text-muted-foreground">{entry.time}</TableCell><TableCell className="font-medium">{entry.actor}</TableCell><TableCell>{entry.action}</TableCell><TableCell className="text-sm text-muted-foreground">{entry.target}</TableCell><TableCell><Badge variant="outline">{entry.type}</Badge></TableCell></TableRow>)}</TableBody></Table><div className="border-t px-6 py-4 text-xs text-muted-foreground">Displaying {rows.length} matching events</div></CardContent></Card>
    </AnimatedPage>
  );
}
