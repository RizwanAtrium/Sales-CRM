"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const sources = ["Cold Calling", "Meta / Facebook Ads", "LinkedIn Outreach", "Google / SEO", "Referral", "Other"];

export function NewLeadForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="bg-card/90">
        <CardHeader><CardTitle>Lead information</CardTitle><CardDescription>Required fields are marked. Reach-back date always blocks incomplete saves.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="leadSource">Lead source *</Label><select id="leadSource" name="leadSource" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm">{sources.map((source) => <option key={source}>{source}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="reachBackDate">Reach-back date *</Label><Input id="reachBackDate" name="reachBackDate" type="datetime-local" required /></div>
          <div className="space-y-2"><Label htmlFor="customerName">Customer name *</Label><Input id="customerName" name="customerName" required placeholder="Contact person" /></div>
          <div className="space-y-2"><Label htmlFor="businessName">Business name *</Label><Input id="businessName" name="businessName" required placeholder="Company or brand" /></div>
          <div className="space-y-2"><Label htmlFor="phoneNumber">Phone number *</Label><Input id="phoneNumber" name="phoneNumber" required placeholder="+1 555 000 0000" /></div>
          <div className="space-y-2"><Label htmlFor="mobileNumber">Mobile number</Label><Input id="mobileNumber" name="mobileNumber" placeholder="Secondary number" /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="customer@business.com" /></div>
          <div className="space-y-2"><Label htmlFor="niche">Niche / industry</Label><Input id="niche" name="niche" placeholder="Real estate, salon, contractor..." /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="businessAddress">Business address</Label><Input id="businessAddress" name="businessAddress" placeholder="Street, city, state" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Call notes</Label><Textarea id="notes" name="notes" rows={6} placeholder="Context, objections, requirements, and next steps..." /></div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="bg-card/90"><CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader><CardContent className="space-y-2"><Label htmlFor="assignedAgent">Assigned agent</Label><select id="assignedAgent" name="assignedAgentName" className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option>Current user</option><option>Uzma Khan</option><option>Haroon Ali</option><option>Rohan Malik</option></select><p className="text-xs text-muted-foreground">Agents default to themselves. Team Leads and Managers may reassign.</p></CardContent></Card>
        <Card className="border-primary/15 bg-primary/[0.04]"><CardContent className="p-5 text-sm"><p className="font-medium">Follow-up guardrail</p><p className="mt-2 text-xs leading-5 text-muted-foreground">This lead cannot leave the form without a reach-back date. Future updates also require a comment and next action.</p></CardContent></Card>
        <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}><ArrowLeft /> Cancel</Button><Button type="submit" className="flex-1" disabled={saving}><Save />{saving ? "Saving..." : "Save lead"}</Button></div>
      </div>
    </form>
  );
}
