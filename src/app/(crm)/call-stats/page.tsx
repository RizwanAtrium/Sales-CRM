"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CalendarDays, Check, Filter, PhoneCall, Target, TrendingUp, UserCheck, Users, Wifi } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const statFields = ["Calls made", "Connected", "Conversations 2 min+", "Calls booked", "Approved", "No shows"];
const roles = [
  { label: "All roles", value: "ALL" },
  { label: "Agents / Setters", value: "AGENT" },
  { label: "Team Leads / Closers", value: "TEAM_LEAD" },
  { label: "Managers", value: "MANAGER" },
];

type UserOption = { id: string; name: string; email: string; role: string; teamLead: string | null; manager: string | null };
type Totals = { callsMade: number; connected: number; conversationsTwoMinutes: number; callsBooked: number; approved: number; noShows: number };
type PendingStat = { _id: string; date: string; callsMade: number; callsBooked: number; approved: number; agent?: { name?: string; role?: string }; submittedBy?: { name?: string; role?: string } };

function roleLabel(role: string) {
  return role === "AGENT" ? "Agent / Setter" : role === "TEAM_LEAD" ? "Team Lead / Closer" : role === "MANAGER" ? "Manager" : "Super Admin";
}

function SelectBox(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${props.className || ""}`} />;
}

export default function CallStatsPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [totals, setTotals] = useState<Totals>({ callsMade: 0, connected: 0, conversationsTwoMinutes: 0, callsBooked: 0, approved: 0, noShows: 0 });
  const [pending, setPending] = useState<PendingStat[]>([]);
  const [canFilterCloser, setCanFilterCloser] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [teamLeadFilter, setTeamLeadFilter] = useState("ALL");
  const [logUserId, setLogUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const teamLeads = useMemo(() => users.filter((user) => user.role === "TEAM_LEAD"), [users]);
  const loggableUsers = users;
  const selectedLabel = selectedUserIds.length ? `${selectedUserIds.length} selected` : "Whole visible team";
  const connectRate = totals.callsMade ? Math.round((totals.connected / totals.callsMade) * 1000) / 10 : 0;

  const loadStats = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedUserIds.length) params.set("users", selectedUserIds.join(","));
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    if (teamLeadFilter !== "ALL") params.set("teamLead", teamLeadFilter);
    const response = await fetch(`/api/call-stats?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      toast.error("Unable to load call stats");
      setLoading(false);
      return;
    }
    const data = await response.json();
    setUsers(data.users || []);
    setTotals(data.totals || { callsMade: 0, connected: 0, conversationsTwoMinutes: 0, callsBooked: 0, approved: 0, noShows: 0 });
    setPending(data.pending || []);
    setCanFilterCloser(Boolean(data.canFilterCloser));
    setLogUserId((current) => current || data.users?.[0]?.id || "");
    setLoading(false);
  }, [selectedUserIds, roleFilter, teamLeadFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStats]);

  async function approveStat(id: string, status: "APPROVED" | "REJECTED") {
    const response = await fetch("/api/call-stats", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (response.ok) {
      toast.success(status === "APPROVED" ? "Call stats approved" : "Call stats rejected");
      await loadStats();
    } else toast.error((await response.json()).error || "Unable to update approval");
  }

  return (
    <AnimatedPage>
      <PageHeader title="Daily call activity" description="Log one activity record per agent, per day, and compare output against weekly targets." />

      <Card className="bg-card/90">
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Filter className="size-4 text-primary" /> Role filter</Label>
            <SelectBox value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </SelectBox>
          </div>
          {canFilterCloser ? (
            <div className="space-y-2">
              <Label>Team Lead / Closer</Label>
              <SelectBox value={teamLeadFilter} onChange={(event) => setTeamLeadFilter(event.target.value)}>
                <option value="ALL">All team leads / closers</option>
                {teamLeads.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </SelectBox>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Users className="size-4 text-primary" /> Individual / multiple people</Label>
            <div className="grid max-h-28 gap-2 overflow-y-auto rounded-xl border border-border bg-background p-3 sm:grid-cols-2">
              {users.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selectedUserIds.includes(user.id)} onCheckedChange={(checked) => setSelectedUserIds((current) => checked ? [...current, user.id] : current.filter((id) => id !== user.id))} />
                  <span>{user.name}</span><Badge variant="outline" className="ml-auto text-[10px]">{roleLabel(user.role)}</Badge>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={() => { setSelectedUserIds([]); setRoleFilter("ALL"); setTeamLeadFilter("ALL"); }}>Whole team</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Calls this week", value: totals.callsMade, target: "500 target", progress: (totals.callsMade / 500) * 100, icon: PhoneCall },
          { label: "Connected", value: totals.connected, target: "150 target", progress: (totals.connected / 150) * 100, icon: Wifi },
          { label: "Appointments", value: totals.callsBooked, target: "35 target", progress: (totals.callsBooked / 35) * 100, icon: CalendarDays },
          { label: "Connect rate", value: `${connectRate}%`, target: selectedLabel, progress: connectRate, icon: TrendingUp },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-semibold">{loading ? "..." : item.value}</p></div><item.icon className="size-5 text-primary" /></div><div className="mt-4 flex items-center gap-3"><Progress value={Math.min(Number(item.progress) || 0, 100)} className="h-1.5" /><span className="whitespace-nowrap text-[10px] text-muted-foreground">{item.target}</span></div></CardContent></Card>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/90">
          <CardHeader><CardTitle>Log today&apos;s numbers</CardTitle><CardDescription>Select the person first. Agents submit their own numbers; Team Lead / Closer and Manager approvals control when numbers appear in totals.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const payload = {
                  agent: String(form.get("agent") || logUserId),
                  date: new Date().toISOString(),
                  callsMade: Number(form.get("Calls made") || 0),
                  connected: Number(form.get("Connected") || 0),
                  conversationsTwoMinutes: Number(form.get("Conversations 2 min+") || 0),
                  callsBooked: Number(form.get("Calls booked") || 0),
                  approved: Number(form.get("Approved") || 0),
                  noShows: Number(form.get("No shows") || 0),
                  notes: String(form.get("observations") || ""),
                  offDay: Boolean(form.get("offDay")),
                };
                const response = await fetch("/api/call-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (response.ok) {
                  const result = await response.json();
                  toast.success(result.status === "APPROVED" ? "Daily call stats saved and approved" : "Daily call stats submitted for approval");
                  await loadStats();
                  event.currentTarget.reset();
                } else toast.error((await response.json()).error || "Unable to save daily stats");
              }}>
              <div className="space-y-2">
                <Label htmlFor="agent">Agent / Team Lead / Closer</Label>
                <SelectBox id="agent" name="agent" value={logUserId} onChange={(event) => setLogUserId(event.target.value)} className="w-full">
                  {loggableUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {roleLabel(user.role)}</option>)}
                </SelectBox>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statFields.map((field, index) => <div key={field} className="space-y-2"><Label htmlFor={`stat-${index}`}>{field}</Label><Input id={`stat-${index}`} name={field} type="number" min="0" placeholder="0" /></div>)}
              </div>
              <div className="space-y-2"><Label htmlFor="observations">Notes / observations</Label><Textarea id="observations" name="observations" rows={4} placeholder="What worked, objections heard, and follow-up context..." /></div>
              <label className="flex items-center gap-2 text-sm"><Checkbox name="offDay" /> Mark today as an off-day</label>
              <div className="flex justify-end"><Button type="submit" size="lg"><Check /> Save daily stats</Button></div>
            </form>
          </CardContent>
        </Card>
        <Card className="bg-card/90">
          <CardHeader><CardTitle>Weekly targets</CardTitle><CardDescription>Approved performance for the selected team/person filter</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {[
              ["Calls made", totals.callsMade, 500], ["Connected", totals.connected, 150], ["Conversations 2 min+", totals.conversationsTwoMinutes, 100], ["Calls booked", totals.callsBooked, 35], ["Approved", totals.approved, 25],
            ].map(([label, actual, target]) => <div key={label as string}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="font-mono text-xs"><b>{actual}</b> / {target}</span></div><Progress value={(Number(actual) / Number(target)) * 100} className="h-1.5" /></div>)}
            <div className="rounded-xl border border-primary/15 bg-primary/[0.05] p-4"><div className="flex items-center gap-2 text-sm font-medium"><Target className="size-4 text-primary" /> Filter: {selectedLabel}</div><p className="mt-1 text-xs text-muted-foreground">Totals include only approved call-stat submissions.</p></div>
          </CardContent>
        </Card>
      </div>

      {pending.length ? (
        <Card className="bg-card/90">
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="size-5 text-primary" /> Pending call-stat approvals</CardTitle><CardDescription>Approve agent numbers as Team Lead / Closer, and Team Lead / Closer numbers as Manager.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {pending.map((item) => (
              <div key={item._id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                <div><p className="font-medium">{item.agent?.name || "User"} <Badge variant="outline">{roleLabel(item.agent?.role || "AGENT")}</Badge></p><p className="text-sm text-muted-foreground">Submitted by {item.submittedBy?.name || "Unknown"} · {item.callsMade} calls · {item.callsBooked} booked · {item.approved} approved</p></div>
                <div className="flex gap-2"><Button size="sm" onClick={() => approveStat(item._id, "APPROVED")}>Approve</Button><Button size="sm" variant="outline" onClick={() => approveStat(item._id, "REJECTED")}>Reject</Button></div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </AnimatedPage>
  );
}
