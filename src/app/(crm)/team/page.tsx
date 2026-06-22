import { MoreHorizontal, Plus, ShieldCheck, UserCheck, UsersRound, Filter, Users } from "lucide-react";
import Link from "next/link";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const metadata = { title: "Team" };

type TeamRole = "Setter" | "Team Lead" | "Closer" | "Manager";

type WorkloadMember = {
  name: string;
  role: TeamRole;
  initials: string;
  team: string;
  manager: string;
  teamLeadCloser: string;
  calls: number;
  appointments: number;
  approved: number;
  inProgress: number;
  won: number;
  lost: number;
  revenue: number;
  activeLeads: number;
  rate: number;
};

const workloadMembers: WorkloadMember[] = [
  { name: "Uzma Khan", role: "Setter", initials: "UK", team: "Blue Team", manager: "Sales Manager", teamLeadCloser: "Ali Raza", calls: 342, appointments: 28, approved: 19, inProgress: 0, won: 0, lost: 0, revenue: 0, activeLeads: 116, rate: 76 },
  { name: "Rohan Malik", role: "Setter", initials: "RM", team: "Blue Team", manager: "Sales Manager", teamLeadCloser: "Ali Raza", calls: 317, appointments: 22, approved: 15, inProgress: 0, won: 0, lost: 0, revenue: 0, activeLeads: 104, rate: 68 },
  { name: "Haroon Ali", role: "Closer", initials: "HA", team: "Green Team", manager: "Sales Manager", teamLeadCloser: "Haroon Ali", calls: 0, appointments: 0, approved: 24, inProgress: 14, won: 11, lost: 3, revenue: 38400, activeLeads: 72, rate: 88 },
  { name: "Ali Raza", role: "Team Lead", initials: "AR", team: "Blue Team", manager: "Sales Manager", teamLeadCloser: "Ali Raza", calls: 0, appointments: 0, approved: 19, inProgress: 11, won: 9, lost: 2, revenue: 31200, activeLeads: 81, rate: 82 },
  { name: "Sales Manager", role: "Manager", initials: "SM", team: "All Teams", manager: "Asad", teamLeadCloser: "Sales Manager", calls: 0, appointments: 0, approved: 43, inProgress: 25, won: 20, lost: 5, revenue: 69600, activeLeads: 153, rate: 84 },
];

function metricSet(member: WorkloadMember) {
  if (member.role === "Setter") {
    return [
      { label: "Calls", value: member.calls.toLocaleString() },
      { label: "Booked", value: member.appointments.toLocaleString() },
      { label: "Approved", value: member.approved.toLocaleString() },
    ];
  }
  if (member.role === "Manager") {
    return [
      { label: "Approvals", value: member.approved.toLocaleString() },
      { label: "Closed", value: member.won.toLocaleString() },
      { label: "Revenue", value: `$${Math.round(member.revenue / 1000)}k` },
    ];
  }
  return [
    { label: "Approved", value: member.approved.toLocaleString() },
    { label: "In progress", value: member.inProgress.toLocaleString() },
    { label: "Won", value: member.won.toLocaleString() },
  ];
}

function profileHref(member: WorkloadMember) {
  return `/team/${member.initials.toLowerCase()}`;
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ role?: string; team?: string; person?: string }> }) {
  const query = await searchParams;
  const roles = Array.from(new Set(workloadMembers.map((member) => member.role)));
  const teams = Array.from(new Set(workloadMembers.map((member) => member.team)));
  const people = workloadMembers.map((member) => member.name);

  const visibleMembers = workloadMembers.filter((member) => {
    const matchesRole = !query.role || query.role === "ALL" || member.role === query.role;
    const matchesTeam = !query.team || query.team === "ALL" || member.team === query.team;
    const matchesPerson = !query.person || query.person === "ALL" || member.name === query.person;
    return matchesRole && matchesTeam && matchesPerson;
  });

  const setters = visibleMembers.filter((member) => member.role === "Setter");
  const leaders = visibleMembers.filter((member) => member.role === "Team Lead" || member.role === "Closer");
  const managers = visibleMembers.filter((member) => member.role === "Manager");
  const activeLeadLoad = visibleMembers.reduce((total, member) => total + member.activeLeads, 0);
  const pendingApprovals = visibleMembers.reduce((total, member) => total + (member.role === "Setter" ? member.approved : member.inProgress), 0);
  const avgLeadLoad = setters.length ? Math.round(setters.reduce((total, member) => total + member.activeLeads, 0) / setters.length) : activeLeadLoad;

  return (
    <AnimatedPage>
      <PageHeader title="Team and workload" description="Manage hierarchy, performance, active lead ownership, and role-based sales workload." action="Add team member" actionHref="/team/new" />

      <Card className="bg-card/90">
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium"><Filter className="size-4 text-primary" /> Role</p>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-start" />}>{query.role && query.role !== "ALL" ? query.role : "All roles"}</DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem render={<Link href="/team" />}>All roles</DropdownMenuItem>
                {roles.map((role) => <DropdownMenuItem key={role} render={<Link href={`/team?role=${encodeURIComponent(role)}`} />}>{role}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium"><Users className="size-4 text-primary" /> Team</p>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-start" />}>{query.team && query.team !== "ALL" ? query.team : "Whole team"}</DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem render={<Link href="/team" />}>Whole team</DropdownMenuItem>
                {teams.map((team) => <DropdownMenuItem key={team} render={<Link href={`/team?team=${encodeURIComponent(team)}`} />}>{team}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Individual</p>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-start" />}>{query.person && query.person !== "ALL" ? query.person : "All people"}</DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem render={<Link href="/team" />}>All people</DropdownMenuItem>
                {people.map((person) => <DropdownMenuItem key={person} render={<Link href={`/team?person=${encodeURIComponent(person)}`} />}>{person}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-end"><Button nativeButton={false} render={<Link href="/team" />} variant="outline">Reset filters</Button></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active users", value: visibleMembers.length.toLocaleString(), note: `${managers.length} managers · ${leaders.length} team leads/closers · ${setters.length} setters`, icon: UsersRound },
          { label: "Active lead load", value: activeLeadLoad.toLocaleString(), note: `${avgLeadLoad || 0} average per setter`, icon: UserCheck },
          { label: "Pending approvals", value: pendingApprovals.toLocaleString(), note: "Role-based approvals and in-progress ownership", icon: ShieldCheck },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.note}</p></div></CardContent></Card>)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleMembers.map((member) => (
          <Card key={member.name} className="bg-card/90 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between"><div className="flex items-center gap-3"><Avatar className="size-11"><AvatarFallback className="bg-primary/10 text-primary">{member.initials}</AvatarFallback></Avatar><div><CardTitle className="text-sm"><Link href={profileHref(member)} className="hover:text-primary">{member.name}</Link></CardTitle><Badge variant="secondary" className="mt-1">{member.role}</Badge><p className="mt-1 text-[11px] text-muted-foreground">{member.team} · {member.role === "Setter" ? `Closer: ${member.teamLeadCloser}` : `Manager: ${member.manager}`}</p></div></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${member.name} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={profileHref(member)} />}>View profile</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads?${member.role === "Setter" ? "agent" : "closer"}=${encodeURIComponent(member.name)}`} />}>View leads</DropdownMenuItem><DropdownMenuItem render={<Link href={`/call-stats?person=${encodeURIComponent(member.name)}`} />}>View performance</DropdownMenuItem></DropdownMenuContent></DropdownMenu></CardHeader>
            <CardContent><div className="grid grid-cols-3 gap-2 text-center">{metricSet(member).map((metric) => <div key={metric.label} className="rounded-lg bg-muted/60 p-2"><p className="font-mono text-sm font-semibold">{metric.value}</p><p className="text-[10px] text-muted-foreground">{metric.label}</p></div>)}</div><div className="mt-4"><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Target pace</span><span>{member.rate}%</span></div><Progress value={member.rate} className="h-1.5" /></div></CardContent>
          </Card>
        ))}
        <Link href="/team/new" className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><span className="grid size-10 place-items-center rounded-full bg-muted"><Plus /></span><span className="mt-3 text-sm font-medium">Add team member</span><span className="mt-1 text-xs">Agent, closer, or team lead</span></Link>
      </div>
    </AnimatedPage>
  );
}
