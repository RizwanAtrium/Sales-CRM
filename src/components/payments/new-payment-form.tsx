"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OpportunityOption = {
  _id: string;
  totalDealValue: number;
  amountToReceive: number;
  lead?: {
    businessName?: string;
    customerName?: string;
    phoneNumber?: string;
    mobileNumber?: string;
    email?: string;
  };
  setter?: { _id?: string; name?: string };
  closer?: { _id?: string; name?: string } | null;
};

type UserOption = { _id?: string; id?: string; name: string; email?: string; role: string };
type ServiceLine = { serviceName: string; price: string };

const blankService = (): ServiceLine => ({ serviceName: "", price: "" });

export function NewPaymentForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [currentUser, setCurrentUser] = useState<UserOption | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [services, setServices] = useState<ServiceLine[]>([blankService()]);
  const [agentId, setAgentId] = useState("");
  const [closerId, setCloserId] = useState("");

  const selectedOpportunity = opportunities.find((item) => item._id === selectedOpportunityId);
  const selectableUsers = users.length > 0 ? users : currentUser ? [currentUser] : [];
  const totalServices = useMemo(() => services.reduce((sum, line) => sum + Number(line.price || 0), 0), [services]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        const user = data.user ?? data;
        setCurrentUser(user);
        const userId = user?._id ?? user?.id ?? user?.sub ?? "";
        if (userId) {
          setAgentId((value) => value || userId);
          setCloserId((value) => value || userId);
        }
      })
      .catch(() => setCurrentUser(null));

    fetch("/api/users")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setUsers(data.items ?? []))
      .catch(() => setUsers([]));

    fetch("/api/opportunities")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setOpportunities((data.items ?? []).filter((item: { stage: string }) => item.stage === "CLOSED_WON" || item.stage === "FORWARDED_TO_CST")))
      .catch(() => setOpportunities([]));
  }, []);

  function updateService(index: number, field: keyof ServiceLine, value: string) {
    setServices((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));
  }

  function addService() {
    setServices((current) => [...current, blankService()]);
  }

  function removeService(index: number) {
    setServices((current) => current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const opportunityId = String(form.get("opportunityId"));
    const serviceLines = services.map((line) => ({ serviceName: line.serviceName.trim(), price: Number(line.price) })).filter((line) => line.serviceName && line.price >= 0);

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.get("amount")),
          receivedAt: form.get("receivedAt"),
          note: form.get("note"),
          businessName: form.get("businessName"),
          customerName: form.get("customerName"),
          phoneNumber: form.get("phoneNumber"),
          mobileNumber: form.get("mobileNumber"),
          email: form.get("email"),
          agentId: form.get("agentId") || undefined,
          closerId: form.get("closerId") || undefined,
          serviceLines,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment failed");
      toast.success("Payment and sale details recorded");
      router.push("/payments");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setSaving(false);
    }
  }

  const selectedLead = selectedOpportunity?.lead;

  return <form onSubmit={submit} className="mx-auto max-w-4xl"><Card className="bg-card/90"><CardHeader><CardTitle>Record sale payment</CardTitle><CardDescription>Capture customer, service, payment, agent, and closer details in one immutable sale log.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><Label htmlFor="opportunityId">Closed-Won deal</Label><select id="opportunityId" name="opportunityId" required value={selectedOpportunityId} onChange={(event) => { const nextId = event.target.value; setSelectedOpportunityId(nextId); const nextOpportunity = opportunities.find((item) => item._id === nextId); if (nextOpportunity?.setter?._id) setAgentId(nextOpportunity.setter._id); if (nextOpportunity?.closer?._id) setCloserId(nextOpportunity.closer._id); }} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Select a real Closed-Won deal</option>{opportunities.map((item) => <option value={item._id} key={item._id}>{item.lead?.businessName ?? "Closed-Won deal"} · Outstanding ${Number(item.amountToReceive ?? item.totalDealValue).toLocaleString()}</option>)}</select></div>

    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="businessName">Business name</Label><Input id="businessName" name="businessName" required defaultValue={selectedLead?.businessName ?? ""} placeholder="Business name" /></div><div className="space-y-2"><Label htmlFor="customerName">Customer name</Label><Input id="customerName" name="customerName" required defaultValue={selectedLead?.customerName ?? ""} placeholder="Customer full name" /></div><div className="space-y-2"><Label htmlFor="phoneNumber">Phone</Label><Input id="phoneNumber" name="phoneNumber" required defaultValue={selectedLead?.phoneNumber ?? ""} placeholder="Primary phone" /></div><div className="space-y-2"><Label htmlFor="mobileNumber">Mobile</Label><Input id="mobileNumber" name="mobileNumber" required defaultValue={selectedLead?.mobileNumber ?? ""} placeholder="Mobile number" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required defaultValue={selectedLead?.email ?? ""} placeholder="customer@email.com" /></div></div>

    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="agentId">Agent / setter</Label><select id="agentId" name="agentId" value={agentId} onChange={(event) => setAgentId(event.target.value)} required className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Select agent</option>{selectableUsers.map((item) => { const id = item._id ?? item.id ?? ""; return <option key={id || item.email} value={id}>{item.name} · {item.role.replace("_", " ")}</option>; })}</select></div><div className="space-y-2"><Label htmlFor="closerId">Closer</Label><select id="closerId" name="closerId" value={closerId} onChange={(event) => setCloserId(event.target.value)} required className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Select closer</option>{selectableUsers.map((item) => { const id = item._id ?? item.id ?? ""; return <option key={id || item.email} value={id}>{item.name} · {item.role.replace("_", " ")}</option>; })}</select><p className="text-xs text-muted-foreground">If the agent closes their own sale, select the same person as agent and closer. If Super Admin is making the sale, select Super Admin as closer.</p></div></div>

    <div className="space-y-3"><div className="flex items-center justify-between"><div><Label>Services sold</Label><p className="text-xs text-muted-foreground">Add every service/add-on in this same log with its own price.</p></div><Button type="button" variant="outline" size="sm" onClick={addService}><Plus className="size-4" /> Add service</Button></div>{services.map((line, index) => <div key={index} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_180px_auto]"><div className="space-y-2"><Label htmlFor={`serviceName-${index}`}>Service {index + 1}</Label><Input id={`serviceName-${index}`} value={line.serviceName} onChange={(event) => updateService(index, "serviceName", event.target.value)} placeholder="Website, SEO, ads, hosting, etc." required /></div><div className="space-y-2"><Label htmlFor={`servicePrice-${index}`}>Price</Label><Input id={`servicePrice-${index}`} value={line.price} onChange={(event) => updateService(index, "price", event.target.value)} type="number" min="0" step="0.01" placeholder="0" required /></div><div className="flex items-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)} disabled={services.length === 1} aria-label="Remove service"><Trash2 className="size-4" /></Button></div></div>)}<div className="rounded-xl bg-muted/60 px-4 py-3 text-right text-sm"><span className="text-muted-foreground">Services total: </span><span className="font-mono text-base font-semibold">${totalServices.toLocaleString()}</span></div></div>

    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="amount">Amount received</Label><Input id="amount" name="amount" type="number" min="1" step="0.01" required placeholder="Amount paid now" /></div><div className="space-y-2"><Label htmlFor="receivedAt">Date received</Label><Input id="receivedAt" name="receivedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div></div><div className="space-y-2"><Label htmlFor="paymentNote">Payment note</Label><Textarea id="paymentNote" name="note" rows={4} placeholder="Method, reference, installment, or receipt details..." /></div><div className="flex justify-end"><Button type="submit" size="lg" disabled={saving || opportunities.length === 0}><CircleDollarSign />{saving ? "Saving..." : "Record payment"}</Button></div></CardContent></Card></form>;
}
