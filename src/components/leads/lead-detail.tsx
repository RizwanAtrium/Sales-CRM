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
import { usTimeZones } from "@/lib/us-timezones";

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
    const nextReachBackTimeZone = String(form.get("nextReachBackTimeZone") || "America/New_York");
    if (outcome === "CONTINUE" && !nextReachBackDate) return toast.error("Next reach-back date and time are required");
    if (outcome === "RESCHEDULE" && !nextReachBackDate) return toast.error("Reschedule requires callback date and time");
    const payload = { comment: form.get("comment"), outcome, nextReachBackDate: nextReachBackDate || undefined, nextReachBackTimeZone };
    if (/^[0-9a-f]{24}$/i.test(lead.id)) {
      const response = await fetch(`/api/leads/${lead.id}/follow-up`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) return toast.error((await response.json()).error || "Follow-up failed");
    }
    const scheduledAgain = ["CONTINUE", "RESCHEDULE"].includes(outcome);
    setLead((current) => ({ ...current, callback: scheduledAgain ? new Date(nextReachBackDate).toLocaleString("en-US", { timeZone: "America/New_York" }) : "Follow-up closed", stage: scheduledAgain ? current.stage : outcome.replaceAll("_", " ") }));
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

  async function saveEdit() {
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: lead.customer, businessName: lead.business, phoneNumber: lead.phone, email: lead.email }),
    });
    if (!response.ok) return toast.error((await response.json()).error || "Lead update failed");
    setEditOpen(false);
    toast.success("Lead updated");
  }

  async function requestRemoval() {
    const reason = window.prompt("Removal reason", "Duplicate or invalid record");
    if (!reason) return;
    const response = await fetch("/api/removal-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "LEAD", targetId: lead.id, reason }),
    });
    if (!response.ok) return toast.error((await response.json()).error || "Removal request failed");
    toast.success("Removal request sent for IT/admin approval");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<a href={`tel:${lead.phone || ""}`} />} variant="outline"><Phone /> Call</Button>
        <Button nativeButton={false} render={<a href={`mailto:${lead.email || ""}`} />} variant="outline"><Mail /> Email</Button>
        <Dialog open={followOpen} onOpenChange={setFollowOpen}>
          <DialogTrigger render={<Button />}><MessageSquareText /> Log follow-up</DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Log follow-up outcome</DialogTitle><DialogDescription>A disposition is required for every scheduled callback.</DialogDescription></DialogHeader><form onSubmit={saveFollowUp} className="space-y-4"><div className="space-y-2"><Label>Call notes *</Label><Textarea name="comment" required rows={4} placeholder="What happened on the call?" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Disposition *</Label><select name="outcome" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="CONNECTED">Connected</option><option value="NO_ANSWER">No answer</option><option value="VOICEMAIL">Voicemail</option><option value="RESCHEDULE">Reschedule</option><option value="NOT_INTERESTED">Not interested</option></select></div><div className="space-y-2"><Label>Next callback date and time</Label><Input name="nextReachBackDate" type="datetime-local" /></div><div className="space-y-2 sm:col-span-2"><Label>Reach-back timezone</Label><select name="nextReachBackTimeZone" className="h-9 w-full rounded-lg border bg-background px-3 text-sm">{usTimeZones.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}</select></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setFollowOpen(false)}>Cancel</Button><Button type="submit">Save disposition</Button></DialogFooter></form></DialogContent>
        </Dialog>
        <Button onClick={submitAppointment}><Send /> Submit appointment</Button>
        <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogTrigger render={<Button variant="outline" />}><Pencil /> Edit</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit lead</DialogTitle><DialogDescription>Updates remain visible in audit history.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Customer</Label><Input value={lead.customer} onChange={(event) => setLead({ ...lead, customer: event.target.value })} /></div><div className="space-y-2"><Label>Business</Label><Input value={lead.business} onChange={(event) => setLead({ ...lead, business: event.target.value })} /></div><div className="space-y-2"><Label>Phone</Label><Input value={lead.phone || ""} onChange={(event) => setLead({ ...lead, phone: event.target.value })} /></div><div className="space-y-2"><Label>Email</Label><Input value={lead.email || ""} onChange={(event) => setLead({ ...lead, email: event.target.value })} /></div></div><DialogFooter><Button onClick={saveEdit}>Save changes</Button></DialogFooter></DialogContent></Dialog>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="bg-card/90"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-2xl">{lead.business}</CardTitle><CardDescription className="mt-1">{lead.customer} · {lead.id}</CardDescription></div><Badge>{lead.stage}</Badge></div></CardHeader><CardContent>
          <Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="history">History</TabsTrigger><TabsTrigger value="ownership">Ownership</TabsTrigger></TabsList>
            <TabsContent value="overview" className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Lead source" value={lead.source} /><Info label="Niche" value={lead.niche || "-"} /><Info label="Phone" value={lead.phone || "-"} /><Info label="Email" value={lead.email || "-"} /><Info label="Assigned agent" value={lead.agent} /><Info label="Pipeline value" value={lead.value} /><div className="sm:col-span-2 rounded-xl border bg-muted/35 p-4"><p className="text-xs text-muted-foreground">Visible notes</p><p className="mt-2 text-sm leading-6">Only current-owner notes are shown after reassignment. Previous agent notes stay preserved in audit/private history.</p></div></TabsContent>
            <TabsContent value="history" className="mt-5 space-y-3">{["Lead created", "Callback rescheduled", "Pricing deck sent", "Follow-up due"].map((event, index) => <div key={event} className="flex gap-3 rounded-xl border p-4"><span className="mt-0.5 grid size-7 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-3.5" /></span><div><p className="text-sm font-medium">{event}</p><p className="mt-1 text-xs text-muted-foreground">{index === 0 ? "Rohan Malik" : lead.agent} · {index + 1} day{index ? "s" : ""} ago</p></div></div>)}</TabsContent>
            <TabsContent value="ownership" className="mt-5"><div className="rounded-xl border p-4"><div className="flex items-center gap-3"><UserRound className="size-5 text-primary" /><div><p className="font-medium">{lead.agent}</p><p className="text-xs text-muted-foreground">Current owner · assigned by Ali Raza</p></div></div></div></TabsContent>
          </Tabs>
        </CardContent></Card>
        <div className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-500/[0.05]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="size-4 text-amber-500" /> Next follow-up</CardTitle></CardHeader><CardContent><p className="text-xl font-semibold">{lead.callback}</p><p className="mt-2 text-xs text-muted-foreground">The lead remains in the agent queue until an outcome is logged.</p></CardContent></Card>
          <Card className="bg-card/90"><CardHeader><CardTitle className="text-base">Removal control</CardTitle><CardDescription>Nothing is hard-deleted.</CardDescription></CardHeader><CardContent><Button variant="destructive" className="w-full" onClick={requestRemoval}><Trash2 /> Request removal</Button></CardContent></Card>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-medium">{value}</p></div>;
}
