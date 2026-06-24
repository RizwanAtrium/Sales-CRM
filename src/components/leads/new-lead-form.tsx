"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usTimeZones } from "@/lib/us-timezones";

const sources = ["GMB", "Yelp", "Meta Ads Library"];

export function NewLeadForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [teamLeads, setTeamLeads] = useState<Array<{ _id?: string; id?: string; name: string; email?: string }>>([]);

  useEffect(() => {
    fetch("/api/users", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setTeamLeads((data.items ?? []).filter((user: { role: string; active?: boolean }) => user.role === "TEAM_LEAD" && user.active !== false)))
      .catch(() => setTeamLeads([]));
  }, []);

  function checkReady(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    setReady(["leadSource", "reachBackDate", "reachBackTimeZone", "customerName", "businessName", "phoneNumber", "niche", "assignedTeamLead"].every((key) => String(form.get(key) || "").trim()));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success("Lead created");
        router.push(`/leads/${result.item._id}`);
        return;
      }
      if (response.status !== 401) throw new Error(result.error || "Unable to create lead");
      const id = `LD-${Date.now().toString().slice(-5)}`;
      localStorage.setItem(`sales-crm-lead-${id}`, JSON.stringify({ ...payload, id, stage: "New" }));
      toast.success("Lead saved in review workspace");
      router.push(`/leads/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} onInput={checkReady} onChange={checkReady} className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="bg-card/90">
        <CardHeader><CardTitle>Lead information</CardTitle><CardDescription>Required fields are marked. Reach-back date always blocks incomplete saves.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="leadSource">Lead source *</Label><select id="leadSource" name="leadSource" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm">{sources.map((source) => <option key={source}>{source}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="reachBackDate">Callback date and time *</Label><Input id="reachBackDate" name="reachBackDate" type="datetime-local" required /></div>
          <div className="space-y-2"><Label htmlFor="reachBackTimeZone">Reach-back timezone *</Label><select id="reachBackTimeZone" name="reachBackTimeZone" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm">{usTimeZones.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="customerName">Customer name *</Label><Input id="customerName" name="customerName" required placeholder="Contact person" /></div>
          <div className="space-y-2"><Label htmlFor="businessName">Business name *</Label><Input id="businessName" name="businessName" required placeholder="Company or brand" /></div>
          <div className="space-y-2"><Label htmlFor="phoneNumber">Phone number *</Label><Input id="phoneNumber" name="phoneNumber" required placeholder="+1 555 000 0000" /></div>
          <div className="space-y-2"><Label htmlFor="mobileNumber">Mobile number</Label><Input id="mobileNumber" name="mobileNumber" placeholder="Secondary number" /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="customer@business.com" /></div>
          <div className="space-y-2"><Label htmlFor="niche">Niche / industry *</Label><Input id="niche" name="niche" required placeholder="Real estate, salon, contractor..." /></div>
          <div className="space-y-2"><Label htmlFor="price">Price</Label><Input id="price" name="price" type="number" min="0" placeholder="Optional" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="businessAddress">Business address</Label><Input id="businessAddress" name="businessAddress" placeholder="Street, city, state" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Call notes</Label><Textarea id="notes" name="notes" rows={6} placeholder="Context, objections, requirements, and next steps..." /></div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="bg-card/90"><CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader><CardContent className="space-y-2"><Label htmlFor="assignedTeamLead">Assign to Team Lead *</Label><select id="assignedTeamLead" name="assignedTeamLead" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Select Team Lead</option><option value="SELF">My Team Lead</option>{teamLeads.map((lead) => <option key={lead._id ?? lead.id} value={lead._id ?? lead.id}>{lead.name}{lead.email ? ` · ${lead.email}` : ""}</option>)}</select><p className="text-xs text-muted-foreground">Agents keep the lead, and the selected Team Lead receives the appointment.</p></CardContent></Card>
        <Card className="border-primary/15 bg-primary/[0.04]"><CardContent className="p-5 text-sm"><p className="font-medium">Follow-up guardrail</p><p className="mt-2 text-xs leading-5 text-muted-foreground">This lead cannot leave the form without a reach-back date. Future updates also require a comment and next action.</p></CardContent></Card>
        <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}><ArrowLeft /> Cancel</Button><Button type="submit" className="flex-1" disabled={saving || !ready}><Save />{saving ? "Saving..." : "Save lead"}</Button></div>
      </div>
    </form>
  );
}
