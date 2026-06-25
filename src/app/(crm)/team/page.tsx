import { MoreHorizontal, Plus, UserCheck, UsersRound, Filter } from "lucide-react";
import Link from "next/link";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/user";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { roleLabels, initials } from "@/lib/roles";
import { userVisibilityFilter } from "@/lib/pipeline-access";

export const metadata = { title: "Team" };

type TeamMember = {
  _id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  teamLeadName: string;
  managerName: string;
  activeLeads: number;
  approved: number;
  won: number;
  revenue: number;
  rate: number;
};

function profileHref(member: TeamMember) {
  return `/team/${member._id}`;
}

function metricSet(member: TeamMember) {
  if (member.role === "AGENT") {
    return [
      { label: "Active leads", value: member.activeLeads.toLocaleString() },
      { label: "Approved", value: member.approved.toLocaleString() },
      { label: "Won", value: member.won.toLocaleString() },
    ];
  }
  if (member.role === "MANAGER" || member.role === "SUPER_ADMIN") {
    return [
      { label: "Approvals", value: member.approved.toLocaleString() },
      { label: "Closed", value: member.won.toLocaleString() },
      { label: "Revenue", value: `$${Math.round(member.revenue / 1000)}k` },
    ];
  }
  return [
    { label: "Approved", value: member.approved.toLocaleString() },
    { label: "Won", value: member.won.toLocaleString() },
    { label: "Revenue", value: `$${Math.round(member.revenue / 1000)}k` },
  ];
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ role?: string; team?: string; person?: string }> }) {
  const query = await searchParams;
  const user = await requireActiveUser();
  if (!user) return null;
  await connectToDatabase();

  const allUsers = await User.find({ active: true, ...(await userVisibilityFilter(user)) }).select("name email role teamLead manager lastLoginAt shiftStart shiftEnd availabilityStatus").sort({ name: 1 }).lean();

  const userIdMap = new Map(allUsers.map((u) => [String(u._id), u]));

  const visibleUsers = allUsers.filter((u) => {
    const matchesRole = !query.role || query.role === "ALL" || u.role === query.role;
    return matchesRole;
  });

  const members: TeamMember[] = [];
  for (const u of visibleUsers) {
    const activeLeads = await Lead.countDocuments({ assignedAgent: u._id, status: { $nin: ["CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED", "ARCHIVED"] } });
    const approved = await Opportunity.countDocuments({ $or: [{ setter: u._id, stage: { $in: ["APPROVED", "APPROVED_WON", "CLOSED_WON"] } }, { closer: u._id, stage: { $in: ["APPROVED", "APPROVED_WON", "CLOSED_WON"] } }] });
    const won = await Opportunity.countDocuments({ $or: [{ setter: u._id, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } }, { closer: u._id, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } }] });
    const revResult = await Opportunity.aggregate([
      { $match: { $or: [{ closer: u._id, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } }] } },
      { $group: { _id: null, total: { $sum: "$totalDealValue" } } },
    ]);
    const revenue = revResult[0]?.total ?? 0;
    const teamLeadName = u.teamLead ? (userIdMap.get(String(u.teamLead))?.name ?? "") : "";
    const managerName = u.manager ? (userIdMap.get(String(u.manager))?.name ?? "") : "";
    const rate = Math.min(Math.round(won > 0 ? (won / Math.max(approved, 1)) * 100 : approved > 0 ? 50 : 0), 100);

    members.push({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      initials: initials(u.name),
      teamLeadName,
      managerName,
      activeLeads,
      approved,
      won,
      revenue,
      rate,
    });
  }

  const roles = Array.from(new Set(members.map((m) => m.role)));
  const people = members.map((m) => m.name);

  const filteredMembers = members.filter((m) => {
    const matchesRole = !query.role || query.role === "ALL" || m.role === query.role;
    const matchesPerson = !query.person || query.person === "ALL" || m.name === query.person;
    return matchesRole && matchesPerson;
  });

  const setters = filteredMembers.filter((m) => m.role === "AGENT");
  const leaders = filteredMembers.filter((m) => m.role === "TEAM_LEAD");
  const managers = filteredMembers.filter((m) => m.role === "MANAGER" || m.role === "SUPER_ADMIN");
  const activeLeadLoad = filteredMembers.reduce((total, m) => total + m.activeLeads, 0);
  const avgLeadLoad = setters.length ? Math.round(setters.reduce((total, m) => total + m.activeLeads, 0) / setters.length) : activeLeadLoad;

  return (
    <AnimatedPage>
      <PageHeader title="Team and workload" description="Manage hierarchy, performance, active lead ownership, and role-based sales workload." action="Add team member" actionHref="/team/new" />

      <Card className="bg-card/90">
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium"><Filter className="size-4 text-primary" /> Role</p>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-start" />}>{query.role && query.role !== "ALL" ? roleLabels[query.role as keyof typeof roleLabels] ?? query.role : "All roles"}</DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem render={<Link href="/team" />}>All roles</DropdownMenuItem>
                {roles.map((role) => <DropdownMenuItem key={role} render={<Link href={`/team?role=${encodeURIComponent(role)}`} />}>{roleLabels[role as keyof typeof roleLabels] ?? role}</DropdownMenuItem>)}
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
          { label: "Active users", value: filteredMembers.length.toLocaleString(), note: `${managers.length} managers · ${leaders.length} team leads/closers · ${setters.length} setters`, icon: UsersRound },
          { label: "Active lead load", value: activeLeadLoad.toLocaleString(), note: `${avgLeadLoad || 0} average per setter`, icon: UserCheck },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.note}</p></div></CardContent></Card>)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filteredMembers.map((member) => (
          <Card key={member._id} className="bg-card/90 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between"><div className="flex items-center gap-3"><Avatar className="size-11"><AvatarFallback className="bg-primary/10 text-primary">{member.initials}</AvatarFallback></Avatar><div><CardTitle className="text-sm"><Link href={profileHref(member)} className="hover:text-primary">{member.name}</Link></CardTitle><Badge variant="secondary" className="mt-1">{roleLabels[member.role as keyof typeof roleLabels] ?? member.role}</Badge><p className="mt-1 text-[11px] text-muted-foreground">{member.teamLeadName ? `Closer: ${member.teamLeadName}` : member.managerName ? `Manager: ${member.managerName}` : ""}</p></div></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Open ${member.name} actions`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href={profileHref(member)} />}>View profile</DropdownMenuItem><DropdownMenuItem render={<Link href={`/leads?${member.role === "AGENT" ? "agent" : "closer"}=${encodeURIComponent(member.name)}`} />}>View leads</DropdownMenuItem></DropdownMenuContent></DropdownMenu></CardHeader>
            <CardContent><div className="grid grid-cols-3 gap-2 text-center">{metricSet(member).map((metric) => <div key={metric.label} className="rounded-lg bg-muted/60 p-2"><p className="font-mono text-sm font-semibold">{metric.value}</p><p className="text-[10px] text-muted-foreground">{metric.label}</p></div>)}</div><div className="mt-4"><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Performance</span><span>{member.rate}%</span></div><Progress value={member.rate} className="h-1.5" /></div></CardContent>
          </Card>
        ))}
        <Link href="/team/new" className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><span className="grid size-10 place-items-center rounded-full bg-muted"><Plus /></span><span className="mt-3 text-sm font-medium">Add team member</span><span className="mt-1 text-xs">Agent, closer, or team lead</span></Link>
      </div>
    </AnimatedPage>
  );
}
