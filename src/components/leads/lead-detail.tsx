"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Mail, MessageSquareText, Pencil, Phone, Send, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export type LeadDetailData = {
  id: string;
  customer: string;
  business: string;
  source: string;
  agent: string;
  callback: string;
  stage: string;
  value: string;
  phone?: string;
  email?: string;
  niche?: string;
};

export function LeadDetail({ initialLead, initialAction }: { initialLead: LeadDetailData; initialAction?: string }) {
  const [lead, setLead] = useState(initialLead);
  const [followOpen, setFollowOpen] = useState(initialAction === "follow-up");
  const [editOpen, setEditOpen] = useState(initialAction === "edit");

  async function saveFollowUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const outcome = String(form.get("outcome"));
    const nextReachBackDate = String(form.get("nextReachBackDate") || "");
    if (outcome === "CONTINUE" && !nextReachBackDate) return toast.error("Next reach-back date is required");
    const payload = { comment: form.get("comment"), outcome, nextReachBackDate: nextReachBackDate || undefined };
    if (/^[0-9a-f]{24}$/i.test(lead.id)) {
      const response = await fetch(`/api/leads/${lead.id}/follow-up`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) return toast.error((await response.json()).error || "Follow-up failed");
    }
    setLead((current) => ({ ...current, callback: outcome === "CONTINUE" ? new Date(nextReachBackDate).toLocaleString() : "Follow-up closed", stage: outcome === "CONTINUE" ? current.stage : outcome.replaceAll("_", " ") }));
    setFollowOpen(false);
    toast.success("Follow-up logged");
  }

  async function submitAppointment() {
    if (/^[0-9a-f]{24}$/i.test(lead.id)) {
      const response = await fetch("/api/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
      if (!response.ok) return toast.error((await response.json()).error || "Submission failed");
    }
    setLead((current) => ({ ...current, stage: "Submitted" }));
    toast.success("Appointment submitted for approval");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<a href={`tel:${lead.phone || ""}`} />} variant="outline"><Phone /> Call</Button>
        <Button nativeButton={false} render={<a href={`mailto:${lead.email || ""}`} />} variant="outline"><Mail /> Email</Button>
        <Dialog open={followOpen} onOpenChange={setFollowOpen}>
          <DialogTrigger render={<Button />}><MessageSquareText /> Log follow-up</DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Log follow-up outcome</DialogTitle><DialogDescription>A comment plus a next date or terminal outcome is required.</DialogDescription></DialogHeader><form onSubmit={saveFollowUp} className="space-y-4"><div className="space-y-2"><Label>Call outcome *</Label><Textarea name="comment" required rows={4} placeholder="What happened on the call?" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Outcome</Label><select name="outcome" className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="CONTINUE">Continue follow-up</option><option value="CLOSED_WON">Closed won</option><option value="CLOSED_LOST">Closed lost</option><option value="NOT_INTERESTED">Not interested</option></select></div><div className="space-y-2"><Label>Next reach-back</Label><Input name="nextReachBackDate" type="datetime-local" /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setFollowOpen(false)}>Cancel</Button><Button type="submit">Save outcome</Button></DialogFooter></form></DialogContent>
        </Dialog>
        <Button onClick={submitAppointment}><Send /> Submit appointment</Button>
        <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogTrigger render={<Button variant="outline" />}><Pencil /> Edit</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit lead</DialogTitle><DialogDescription>Updates remain visible in audit history.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Customer</Label><Input value={lead.customer} onChange={(event) => setLead({ ...lead, customer: event.target.value })} /></div><div className="space-y-2"><Label>Business</Label><Input value={lead.business} onChange={(event) => setLead({ ...lead, business: event.target.value })} /></div><div className="space-y-2"><Label>Agent</Label><Input value={lead.agent} onChange={(event) => setLead({ ...lead, agent: event.target.value })} /></div><div className="space-y-2"><Label>Callback</Label><Input value={lead.callback} onChange={(event) => setLead({ ...lead, callback: event.target.value })} /></div></div><DialogFooter><Button onClick={() => { setEditOpen(false); toast.success("Lead updated"); }}>Save changes</Button></DialogFooter></DialogContent></Dialog>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="bg-card/90"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-2xl">{lead.business}</CardTitle><CardDescription className="mt-1">{lead.customer} · {lead.id}</CardDescription></div><Badge>{lead.stage}</Badge></div></CardHeader><CardContent>
          <Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="history">History</TabsTrigger><TabsTrigger value="ownership">Ownership</TabsTrigger></TabsList>
            <TabsContent value="overview" className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Lead source" value={lead.source} /><Info label="Niche" value={lead.niche || "Beauty / personal care"} /><Info label="Phone" value={lead.phone || "+1 555 014 2084"} /><Info label="Email" value={lead.email || "maya@halobeauty.example"} /><Info label="Assigned agent" value={lead.agent} /><Info label="Pipeline value" value={lead.value} /><div className="sm:col-span-2 rounded-xl border bg-muted/35 p-4"><p className="text-xs text-muted-foreground">Latest notes</p><p className="mt-2 text-sm leading-6">Interested in a new website and local SEO. Requested examples before the scheduled callback.</p></div></TabsContent>
            <TabsContent value="history" className="mt-5 space-y-3">{["Lead created", "Callback rescheduled", "Pricing deck sent", "Follow-up due"].map((event, index) => <div key={event} className="flex gap-3 rounded-xl border p-4"><span className="mt-0.5 grid size-7 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-3.5" /></span><div><p className="text-sm font-medium">{event}</p><p className="mt-1 text-xs text-muted-foreground">{index === 0 ? "Rohan Malik" : lead.agent} · {index + 1} day{index ? "s" : ""} ago</p></div></div>)}</TabsContent>
            <TabsContent value="ownership" className="mt-5"><div className="rounded-xl border p-4"><div className="flex items-center gap-3"><UserRound className="size-5 text-primary" /><div><p className="font-medium">{lead.agent}</p><p className="text-xs text-muted-foreground">Current owner · assigned by Ali Raza</p></div></div></div></TabsContent>
          </Tabs>
        </CardContent></Card>
        <div className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-500/[0.05]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="size-4 text-amber-500" /> Next follow-up</CardTitle></CardHeader><CardContent><p className="text-xl font-semibold">{lead.callback}</p><p className="mt-2 text-xs text-muted-foreground">The lead remains in the agent queue until an outcome is logged.</p></CardContent></Card>
          <Card className="bg-card/90"><CardHeader><CardTitle className="text-base">Removal control</CardTitle><CardDescription>Nothing is hard-deleted.</CardDescription></CardHeader><CardContent><Button variant="destructive" className="w-full" onClick={() => toast.success("Removal request sent for approval")}><Trash2 /> Request removal</Button></CardContent></Card>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-medium">{value}</p></div>;
}
