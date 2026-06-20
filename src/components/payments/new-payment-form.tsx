"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OpportunityOption = { _id: string; totalDealValue: number; amountToReceive: number; lead?: { businessName?: string } };

export function NewPaymentForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);

  useEffect(() => {
    fetch("/api/opportunities")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setOpportunities((data.items ?? []).filter((item: { stage: string }) => item.stage === "CLOSED_WON")))
      .catch(() => setOpportunities([]));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const opportunityId = String(form.get("opportunityId"));
    const amount = Number(form.get("amount"));
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, receivedAt: form.get("receivedAt"), note: form.get("note") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment failed");
      toast.success("Payment recorded");
      router.push("/payments");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="mx-auto max-w-2xl"><Card className="bg-card/90"><CardHeader><CardTitle>Record incremental payment</CardTitle><CardDescription>The outstanding balance and payment status recalculate automatically.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="opportunityId">Closed-Won deal</Label><select id="opportunityId" name="opportunityId" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Select a real Closed-Won deal</option>{opportunities.map((item) => <option value={item._id} key={item._id}>{item.lead?.businessName ?? "Closed-Won deal"} · Outstanding ${Number(item.amountToReceive ?? item.totalDealValue).toLocaleString()}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="amount">Amount received</Label><Input id="amount" name="amount" type="number" min="1" required /></div><div className="space-y-2"><Label htmlFor="receivedAt">Date received</Label><Input id="receivedAt" name="receivedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div></div><div className="space-y-2"><Label htmlFor="paymentNote">Payment note</Label><Textarea id="paymentNote" name="note" rows={4} placeholder="Method, reference, installment, or receipt details..." /></div><div className="flex justify-end"><Button type="submit" size="lg" disabled={saving || opportunities.length === 0}><CircleDollarSign />{saving ? "Saving..." : "Record payment"}</Button></div></CardContent></Card></form>;
}
