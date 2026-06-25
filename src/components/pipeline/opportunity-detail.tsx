"use client";

import { useState } from "react";
import { CheckCircle2, CircleDollarSign, Clock3, Send, ThumbsDown, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type ServiceLine = { serviceName: string; price: number };
type OpportunityData = { id: string; business: string; contact: string; value: string; owner: string; age: string; stage: string; amountReceived?: number; serviceLines?: ServiceLine[] };

const services = ["Website", "Google Business Profile (GMB)", "SEO", "Community Management", "Ads Management", "AI Content Creation"];

export function OpportunityDetail({ initialOpportunity }: { initialOpportunity: OpportunityData }) {
  const [opportunity, setOpportunity] = useState(initialOpportunity);
  const [paymentReceived, setPaymentReceived] = useState(initialOpportunity.amountReceived ?? 0);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>(initialOpportunity.serviceLines?.length ? initialOpportunity.serviceLines : [{ serviceName: "Website", price: 0 }]);
  const dealValue = Number(opportunity.value.replace(/[$,]/g, "")) || serviceLines.reduce((sum, line) => sum + Number(line.price || 0), 0);
  const paid = paymentReceived >= dealValue;

  async function changeStage(stage: string, extra?: Record<string, unknown>) {
    if (/^[0-9a-f]{24}$/i.test(opportunity.id)) {
      const response = await fetch(`/api/opportunities/${opportunity.id}/stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: stage.toUpperCase().replaceAll(" ", "_"), ...extra }) });
      if (!response.ok) return toast.error((await response.json()).error || "Stage update failed");
    }
    setOpportunity((current) => ({ ...current, stage }));
    toast.success(`Opportunity moved to ${stage}`);
  }

  async function savePricing() {
    const cleanLines = serviceLines.filter((line) => line.serviceName.trim() && Number(line.price) >= 0);
    if (!cleanLines.length || cleanLines.every((line) => Number(line.price) === 0)) return toast.error("Enter at least one priced service");
    const response = await fetch(`/api/opportunities/${opportunity.id}/stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceLines: cleanLines }) });
    const result = await response.json();
    if (!response.ok) return toast.error(result.error || "Pricing update failed");
    const total = cleanLines.reduce((sum, line) => sum + Number(line.price || 0), 0);
    setOpportunity((current) => ({ ...current, value: `$${total.toLocaleString()}` }));
    setServiceLines(cleanLines);
    toast.success("Pricing saved");
  }

  async function addPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    if (!amount || amount <= 0) return toast.error("Enter a valid payment");
    if (/^[0-9a-f]{24}$/i.test(opportunity.id)) {
      const response = await fetch(`/api/opportunities/${opportunity.id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, serviceLines }) });
      if (!response.ok) return toast.error((await response.json()).error || "Payment failed");
    }
    setPaymentReceived((current) => Math.min(current + amount, dealValue));
    toast.success("Payment recorded");
  }

  async function handoff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (/^[0-9a-f]{24}$/i.test(opportunity.id)) {
      const response = await fetch(`/api/opportunities/${opportunity.id}/handoff`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cstManagerId: form.get("cstManagerId") || undefined, workStartDate: form.get("workStartDate") }) });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || "CST handoff failed");
    }
    setOpportunity((current) => ({ ...current, stage: "Forwarded to CST" }));
    toast.success("Client forwarded to CST");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {opportunity.stage === "Submitted" ? <><Button onClick={() => changeStage("Approved")}><CheckCircle2 /> Approve</Button><Button variant="destructive" onClick={() => changeStage("Rejected")}><ThumbsDown /> Reject</Button></> : null}
        {opportunity.stage === "Approved" ? <Button onClick={() => changeStage("In Progress")}><UserRoundCheck /> Start closing</Button> : null}
        <Dialog><DialogTrigger render={<Button variant="outline" />}><CircleDollarSign /> Pricing</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Deal pricing</DialogTitle><DialogDescription>Capture amount before close. Revenue still counts only after Approved-Won.</DialogDescription></DialogHeader><div className="space-y-3">{serviceLines.map((line, index) => <div key={index} className="grid grid-cols-[1fr_120px] gap-3"><Input value={line.serviceName} onChange={(event) => setServiceLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, serviceName: event.target.value } : item))} list="service-options" placeholder="Service" /><Input type="number" value={line.price} onChange={(event) => setServiceLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(event.target.value) } : item))} min="0" /></div>)}<datalist id="service-options">{services.map((service) => <option key={service} value={service} />)}</datalist><Button type="button" variant="outline" onClick={() => setServiceLines((current) => [...current, { serviceName: "", price: 0 }])}>Add service</Button></div><DialogFooter><Button onClick={savePricing}>Save pricing</Button></DialogFooter></DialogContent></Dialog>
        {opportunity.stage === "In Progress" ? <><Dialog><DialogTrigger render={<Button />}><CheckCircle2 /> Approved-Won</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Mark as Approved-Won</DialogTitle><DialogDescription>Select all sold services/add-ons and record each service price.</DialogDescription></DialogHeader><div className="space-y-3">{serviceLines.map((line, index) => <label key={index} className="grid grid-cols-[1fr_120px] items-center gap-3 rounded-xl border p-3"><Input value={line.serviceName} onChange={(event) => setServiceLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, serviceName: event.target.value } : item))} /><Input type="number" value={line.price} onChange={(event) => setServiceLines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(event.target.value) } : item))} /></label>)}</div><DialogFooter><Button onClick={() => changeStage("Approved Won", { serviceLines })}>Confirm Approved-Won</Button></DialogFooter></DialogContent></Dialog><Button variant="destructive" onClick={() => changeStage("Approved Lost")}><ThumbsDown /> Approved-Lost</Button></> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="bg-card/90"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-2xl">{opportunity.business}</CardTitle><CardDescription>{opportunity.contact} · {opportunity.id}</CardDescription></div><Badge>{opportunity.stage}</Badge></div></CardHeader><CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4"><Info label="Deal value" value={opportunity.value} /><Info label="Closer" value={opportunity.owner} /><Info label="Age" value={opportunity.age} /><Info label="Probability" value={opportunity.stage === "Approved Won" ? "100%" : "68%"} /></div>
          <div><p className="mb-4 text-sm font-medium">Stage history</p><div className="grid gap-3">{["Submitted", "Approved", "In Progress", opportunity.stage].filter((stage, index, list) => list.indexOf(stage) === index).map((stage, index) => <div key={stage} className="flex items-center gap-3 rounded-xl border p-4"><span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-4" /></span><div className="flex-1"><p className="text-sm font-medium">{stage}</p><p className="text-xs text-muted-foreground">{index === 0 ? "Submitted by setter" : "Updated by sales team"}</p></div><span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{index + 1}d ago</span></div>)}</div></div>
        </CardContent></Card>

        <div className="space-y-4">
          <Card className="bg-card/90"><CardHeader><CardTitle className="text-base">Payment status</CardTitle><CardDescription>Incremental ledger against deal value.</CardDescription></CardHeader><CardContent><div className="flex justify-between"><span className="font-mono text-xl font-semibold">${paymentReceived.toLocaleString()}</span><span className="text-sm text-muted-foreground">of ${dealValue.toLocaleString()}</span></div><Progress className="mt-3 h-2" value={dealValue ? paymentReceived / dealValue * 100 : 0} /><form onSubmit={addPayment} className="mt-4 flex gap-2"><Input name="amount" type="number" min="1" max={Math.max(dealValue - paymentReceived, 1)} placeholder="Payment amount" disabled={paid} /><Button type="submit" disabled={paid}><CircleDollarSign /> Add</Button></form></CardContent></Card>
          <Card className="border-primary/15 bg-primary/[0.04]"><CardHeader><CardTitle className="text-base">Sales Manager → CST Manager handoff</CardTitle><CardDescription>Available after Approved-Won and Paid-in-Full. Sales forwards to the CST Manager queue only; CST Manager assigns the handler inside CST CRM.</CardDescription></CardHeader><CardContent><form onSubmit={handoff} className="space-y-3"><div className="space-y-2"><Label>CST manager queue</Label><select name="cstManagerId" className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="CST_MANAGER_QUEUE">CST Manager queue</option></select></div><div className="space-y-2"><Label>Work start date</Label><Input name="workStartDate" type="date" required defaultValue="2026-06-23" /></div><Button className="w-full" type="submit" disabled={!paid || opportunity.stage !== "Approved Won"}><Send /> Forward to CST Manager queue</Button></form></CardContent></Card>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-medium">{value}</p></div>;
}
