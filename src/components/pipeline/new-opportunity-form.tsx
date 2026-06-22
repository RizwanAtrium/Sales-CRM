"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LeadOption = { _id: string; businessName: string; customerName: string; status: string };

export function NewOpportunityForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<LeadOption[]>([]);

  useEffect(() => {
    fetch("/api/leads?limit=100")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setLeads((data.items ?? []).filter((lead: LeadOption) => !["CLOSED_WON", "CLOSED_LOST", "SUBMITTED"].includes(lead.status))))
      .catch(() => setLeads([]));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const leadId = String(form.get("leadId"));
    try {
      const response = await fetch("/api/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit");
      toast.success("Appointment submitted");
      router.push(`/pipeline/${result.item._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="mx-auto max-w-3xl"><Card className="bg-card/90"><CardHeader><CardTitle>Submit appointment</CardTitle><CardDescription>The Team Lead receives this opportunity for approval.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="leadId">Qualified lead</Label><select id="leadId" name="leadId" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Select a real CRM lead</option>{leads.map((lead) => <option value={lead._id} key={lead._id}>{lead.businessName} · {lead.customerName}</option>)}</select></div><div className="space-y-2"><Label htmlFor="notes">Setter notes</Label><Textarea id="notes" name="notes" rows={5} placeholder="Qualification, need, budget, timing, and decision-maker notes..." /></div><div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4 text-xs leading-5 text-muted-foreground">Submission stamps Date Submitted. Approval stamps Date Approved and unlocks closer assignment.</div><div className="flex justify-end"><Button type="submit" size="lg" disabled={saving || leads.length === 0}><Send />{saving ? "Submitting..." : "Submit for approval"}</Button></div></CardContent></Card></form>;
}
