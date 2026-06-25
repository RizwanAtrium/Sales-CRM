import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRightLeft, PhoneCall, ShieldCheck, UserX } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { requireActiveUser } from "@/lib/require-user";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/user";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { roleLabels, initials } from "@/lib/roles";
import { activeLeadFilter, userVisibilityFilter } from "@/lib/pipeline-access";
import { PasswordDisplay } from "@/components/team/password-display";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActiveUser();
  if (!user) return null;
  await connectToDatabase();

  const memberUser = await User.findOne({ _id: id, ...(await userVisibilityFilter(user)) }).populate("teamLead manager", "name").lean();
  if (!memberUser) notFound();

  const memberUserObj = memberUser as Record<string, unknown>;
  const teamLeadObj = memberUserObj.teamLead as { name?: string } | null | undefined;
  const managerObj = memberUserObj.manager as { name?: string } | null | undefined;

  const callsResult = await Opportunity.aggregate([
    { $match: { $or: [{ setter: memberUserObj._id }, { closer: memberUserObj._id }] } },
    { $count: "total" },
  ]);
  const calls = callsResult[0]?.total ?? 0;

  const appointments = await Opportunity.countDocuments({ setter: memberUserObj._id });
  const won = await Opportunity.countDocuments({ $or: [{ setter: memberUserObj._id, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } }, { closer: memberUserObj._id, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } }] });
  const activeLeads = await Lead.countDocuments({ assignedAgent: memberUserObj._id, ...activeLeadFilter });
  const overdue = await Lead.countDocuments({ assignedAgent: memberUserObj._id, reachBackDate: { $lt: new Date() }, ...activeLeadFilter });
  const revResult = await Opportunity.aggregate([
    { $match: { closer: memberUserObj._id, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] } } },
    { $group: { _id: null, total: { $sum: "$totalDealValue" } } },
  ]);
  const revenue = revResult[0]?.total ?? 0;
  const rate = Math.min(Math.round(calls > 0 ? (appointments / Math.max(calls, 1)) * 100 : 0), 100);

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const memberEmail = String(memberUserObj.email ?? "");

  return (
    <AnimatedPage>
      <PageHeader title="Team member details" description="Current workload, hierarchy, sales activity, and retained ownership history." />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="bg-card/90">
          <CardContent className="flex flex-col items-center p-7 text-center">
            <Avatar className="size-20"><AvatarFallback className="bg-primary/10 text-xl text-primary">{initials(String(memberUserObj.name ?? ""))}</AvatarFallback></Avatar>
            <h2 className="mt-4 text-xl font-semibold">{String(memberUserObj.name ?? "")}</h2>
            <Badge className="mt-2">{roleLabels[String(memberUserObj.role ?? "") as keyof typeof roleLabels] ?? String(memberUserObj.role ?? "")}</Badge>
            <p className="mt-2 text-sm text-muted-foreground">{memberEmail}</p>
            <div className="mt-6 grid w-full grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/60 p-3"><p className="font-mono text-lg font-semibold">{calls}</p><p className="text-[10px] text-muted-foreground">Opportunities</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><p className="font-mono text-lg font-semibold">{appointments}</p><p className="text-[10px] text-muted-foreground">Booked</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><p className="font-mono text-lg font-semibold">{won}</p><p className="text-[10px] text-muted-foreground">Won</p></div>
            </div>
            <div className="mt-6 flex w-full gap-2">
              <Button nativeButton={false} render={<Link href={`/leads?agent=${encodeURIComponent(String(memberUserObj.name ?? ""))}`} />} className="flex-1"><PhoneCall /> View leads</Button>
              <Button nativeButton={false} render={<Link href="/settings?tab=assignments" />} variant="outline" className="flex-1"><ArrowRightLeft /> Reassign</Button>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="bg-card/90">
            <CardHeader><CardTitle>Performance and hierarchy</CardTitle><CardDescription>Weekly pace and management chain</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div><div className="mb-2 flex justify-between text-sm"><span>Performance rate</span><span>{rate}%</span></div><Progress value={rate} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Team Lead</p><p className="mt-1 text-sm font-medium">{teamLeadObj?.name ?? "None"}</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Manager</p><p className="mt-1 text-sm font-medium">{managerObj?.name ?? "None"}</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Active leads</p><p className="mt-1 text-sm font-medium">{activeLeads}</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Overdue follow-ups</p><p className="mt-1 text-sm font-medium">{overdue}</p></div>
              </div>
            </CardContent>
          </Card>
          {isSuperAdmin ? (
            <Card className="border-amber-500/20 bg-amber-500/[0.04]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-amber-500" /> Super Admin controls</CardTitle><CardDescription>View user password and manage account.</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-2">
                <PasswordDisplay userId={id} />
                <Button nativeButton={false} render={<Link href="/settings?tab=profile" />} variant="outline" className="flex-1">Reset password</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-500/20 bg-amber-500/[0.04]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-amber-500" /> Account controls</CardTitle><CardDescription>Deactivation preserves all leads, stats, and history.</CardDescription></CardHeader>
              <CardContent className="flex gap-2">
                <Button nativeButton={false} render={<Link href="/settings?tab=profile" />} variant="outline" className="flex-1">Reset password</Button>
                <Button nativeButton={false} render={<Link href="/approvals" />} variant="destructive" className="flex-1"><UserX /> Request deactivation</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

/*
function PasswordDisplay({ userId }: { userId: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">User password</p>
          <p className="mt-1 text-sm font-mono" id="password-display">
            Loading...
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const el = document.getElementById("password-display");
            if (!el) return;
            if (el.dataset.password) {
              el.textContent = el.dataset.password === el.textContent ? "••••••••" : el.dataset.password;
              return;
            }
            try {
              const res = await fetch(`/api/users/${userId}/password`);
              const data = await res.json();
              const pwd = data.passwordVisible ?? "Not available";
              el.dataset.password = pwd;
              el.textContent = pwd;
            } catch {
              el.textContent = "Error loading password";
            }
          }}
        >
          Show password
        </Button>
      </div>
    </div>
  );
}
*/
