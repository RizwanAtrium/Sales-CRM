import { MoreHorizontal, Plus, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { teamPerformance } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <AnimatedPage>
      <PageHeader title="Team and workload" description="Manage hierarchy, performance, active lead ownership, and CST handler capacity." action="Add team member" actionHref="/team/new" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active users", value: "18", note: "2 managers · 4 team leads", icon: UsersRound },
          { label: "Active lead load", value: "2,084", note: "116 average per agent", icon: UserCheck },
          { label: "Pending approvals", value: "6", note: "4 appointments · 2 removals", icon: ShieldCheck },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.note}</p></div></CardContent></Card>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {teamPerformance.map((member) => (
          <Card key={member.name} className="bg-card/90 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between"><div className="flex items-center gap-3"><Avatar className="size-11"><AvatarFallback className="bg-primary/10 text-primary">{member.initials}</AvatarFallback></Avatar><div><CardTitle className="text-sm"><Link href={`/team/${member.initials.toLowerCase()}`} className="hover:text-primary">{member.name}</Link></CardTitle><Badge variant="secondary" className="mt-1">{member.role}</Badge></div></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${member.name} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={`/team/${member.initials.toLowerCase()}`} />}>View profile</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads?agent=${encodeURIComponent(member.name)}`} />}>View leads</DropdownMenuItem></DropdownMenuContent></DropdownMenu></CardHeader>
            <CardContent><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-muted/60 p-2"><p className="font-mono text-sm font-semibold">{member.calls}</p><p className="text-[10px] text-muted-foreground">Calls</p></div><div className="rounded-lg bg-muted/60 p-2"><p className="font-mono text-sm font-semibold">{member.appointments}</p><p className="text-[10px] text-muted-foreground">Booked</p></div><div className="rounded-lg bg-muted/60 p-2"><p className="font-mono text-sm font-semibold">{member.won}</p><p className="text-[10px] text-muted-foreground">Won</p></div></div><div className="mt-4"><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Target pace</span><span>{member.rate}%</span></div><Progress value={member.rate} className="h-1.5" /></div></CardContent>
          </Card>
        ))}
        <Link href="/team/new" className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><span className="grid size-10 place-items-center rounded-full bg-muted"><Plus /></span><span className="mt-3 text-sm font-medium">Add team member</span><span className="mt-1 text-xs">Agent or team lead</span></Link>
      </div>
      <Card className="bg-card/90"><CardHeader><CardTitle>CST handler capacity</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">{[
        ["Sarah Khan", 11, 15], ["Michael Ross", 14, 15], ["Nadia Ali", 8, 15],
      ].map(([name, active, max]) => <div key={name as string} className="rounded-xl border p-4"><div className="flex items-center justify-between"><div><p className="font-medium">{name}</p><p className="text-xs text-muted-foreground">CST handler</p></div><Badge variant={Number(active) >= 14 ? "destructive" : "secondary"}>{active}/{max} clients</Badge></div><Progress value={(Number(active) / Number(max)) * 100} className="mt-4 h-1.5" /></div>)}</CardContent></Card>
    </AnimatedPage>
  );
}
