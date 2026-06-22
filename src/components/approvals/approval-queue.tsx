"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type QueueItem = { id: string; business: string; owner: string; type: "Appointment" | "Removal"; age: string };

export function ApprovalQueue() {
  const [appointments, setAppointments] = useState<QueueItem[]>([]);
  const [removals, setRemovals] = useState<QueueItem[]>([]);

  async function load() {
    const [opportunitiesResponse, removalsResponse] = await Promise.all([fetch("/api/opportunities"), fetch("/api/removal-requests")]);
    if (opportunitiesResponse.ok) {
      const data = await opportunitiesResponse.json();
      setAppointments((data.items ?? []).filter((item: { stage: string }) => item.stage === "SUBMITTED").map((item: { _id: string; lead?: { businessName?: string }; setter?: { name?: string }; createdAt?: string }) => ({ id: item._id, business: item.lead?.businessName ?? "Submitted appointment", owner: item.setter?.name ?? "Setter", type: "Appointment", age: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Pending" })));
    }
    if (removalsResponse.ok) {
      const data = await removalsResponse.json();
      setRemovals((data.items ?? []).filter((item: { status: string }) => item.status === "PENDING").map((item: { _id: string; targetType: string; targetId: string; requester?: { name?: string }; createdAt?: string }) => ({ id: item._id, business: `${item.targetType} removal · ${item.targetId}`, owner: item.requester?.name ?? "Requester", type: "Removal", age: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Pending" })));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch(() => toast.error("Unable to load approvals")); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function decide(item: QueueItem, decision: "APPROVED" | "UNAPPROVED" | "REJECTED") {
    const response = item.type === "Appointment"
      ? await fetch(`/api/opportunities/${item.id}/stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: decision === "APPROVED" ? "APPROVED" : "UNAPPROVED" }) })
      : await fetch(`/api/removal-requests/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: decision === "APPROVED" ? "APPROVED" : "REJECTED" }) });
    const result = await response.json();
    if (!response.ok) return toast.error(result.error || "Decision failed");
    if (item.type === "Appointment") setAppointments((current) => current.filter((row) => row.id !== item.id));
    else setRemovals((current) => current.filter((row) => row.id !== item.id));
    toast.success(`${decision === "APPROVED" ? "Approval" : "Rejection"} recorded`);
  }

  const groups = [["Appointment approvals", "Team Lead review", appointments], ["Removal approvals", "Manager / Super Admin review", removals]] as const;
  return <div className="grid gap-4 lg:grid-cols-2">{groups.map(([title, description, items]) => <Card key={title} className="bg-card/90"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex items-start justify-between"><div><p className="font-medium">{item.business}</p><p className="mt-1 text-xs text-muted-foreground">{item.id} · requested by {item.owner} · {item.age}</p></div><Badge variant="secondary">{item.type}</Badge></div><div className="mt-4 flex justify-end gap-2"><Button variant="destructive" onClick={() => decide(item, item.type === "Appointment" ? "UNAPPROVED" : "REJECTED")}><X /> Reject</Button><Button onClick={() => decide(item, "APPROVED")}><Check /> Approve</Button></div></div>)}{items.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Queue cleared</div> : null}</CardContent></Card>)}</div>;
}
