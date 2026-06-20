import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRightLeft, PhoneCall, ShieldCheck, UserX } from "lucide-react";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { teamPerformance } from "@/lib/demo-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = teamPerformance.find((item) => item.initials.toLowerCase() === id.toLowerCase()) ?? (id.length === 24 ? teamPerformance[0] : null);
  if (!member) notFound();
  return <AnimatedPage><PageHeader title="Team member details" description="Current workload, hierarchy, sales activity, and retained ownership history." /><div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]"><Card className="bg-card/90"><CardContent className="flex flex-col items-center p-7 text-center"><Avatar className="size-20"><AvatarFallback className="bg-primary/10 text-xl text-primary">{member.initials}</AvatarFallback></Avatar><h2 className="mt-4 text-xl font-semibold">{member.name}</h2><Badge className="mt-2">{member.role}</Badge><p className="mt-2 text-sm text-muted-foreground">{member.name.toLowerCase().replace(" ", ".")}@thefinedudes.com</p><div className="mt-6 grid w-full grid-cols-3 gap-2"><Metric value={member.calls} label="Calls" /><Metric value={member.appointments} label="Booked" /><Metric value={member.won} label="Won" /></div><div className="mt-6 flex w-full gap-2"><Button nativeButton={false} render={<Link href={`/leads?agent=${encodeURIComponent(member.name)}`} />} className="flex-1"><PhoneCall /> View leads</Button><Button nativeButton={false} render={<Link href="/settings?tab=assignments" />} variant="outline" className="flex-1"><ArrowRightLeft /> Reassign</Button></div></CardContent></Card><div className="space-y-4"><Card className="bg-card/90"><CardHeader><CardTitle>Performance and hierarchy</CardTitle><CardDescription>Weekly pace and management chain</CardDescription></CardHeader><CardContent className="space-y-5"><div><div className="mb-2 flex justify-between text-sm"><span>Weekly target pace</span><span>{member.rate}%</span></div><Progress value={member.rate} /></div><div className="grid gap-3 sm:grid-cols-2"><Info label="Team Lead" value="Ali Raza" /><Info label="Manager" value="Sales Manager" /><Info label="Active leads" value="116" /><Info label="Overdue follow-ups" value="4" /></div></CardContent></Card><Card className="border-amber-500/20 bg-amber-500/[0.04]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-amber-500" /> Account controls</CardTitle><CardDescription>Deactivation preserves all leads, stats, and history.</CardDescription></CardHeader><CardContent className="flex gap-2"><Button nativeButton={false} render={<Link href="/settings?tab=profile" />} variant="outline" className="flex-1">Reset password</Button><Button nativeButton={false} render={<Link href="/approvals" />} variant="destructive" className="flex-1"><UserX /> Request deactivation</Button></CardContent></Card></div></div></AnimatedPage>;
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-xl bg-muted/60 p-3"><p className="font-mono text-lg font-semibold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}
