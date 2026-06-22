"use client";

import { useState } from "react";
import { ExternalLink, RefreshCw, Send, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const initialHandoffs = [
  { id: "HF-1204", client: "Carter Contracting", services: "Website, SEO", value: "$12,400", handler: "Sarah Khan", status: "Delivered" },
  { id: "HF-1201", client: "Northside Dental", services: "GBP, Google Ads", value: "$8,500", handler: "CST Manager queue", status: "Pending assignment" },
  { id: "HF-1198", client: "Prime Realty", services: "Community Management", value: "$4,800", handler: "Nadia Ali", status: "Failed" },
];

export function HandoffBoard() {
  const [handoffs, setHandoffs] = useState(initialHandoffs);
  function retry(id: string) {
    setHandoffs((current) => current.map((item) => item.id === id ? { ...item, status: "Delivered" } : item));
    toast.success("CST delivery retried successfully");
  }
  return <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"><Card className="bg-card/90"><CardHeader><CardTitle>Handoff delivery log</CardTitle><CardDescription>Idempotent transfer status from Sales CRM to CST CRM.</CardDescription></CardHeader><CardContent className="space-y-3">{handoffs.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Send className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.client}</p><Badge variant={item.status === "Failed" ? "destructive" : item.status === "Delivered" ? "default" : "secondary"}>{item.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.id} · {item.services} · {item.value}</p></div><div className="text-sm"><p className="text-xs text-muted-foreground">CST owner</p><p className="font-medium">{item.handler}</p></div><div className="flex gap-2">{item.status === "Failed" ? <Button variant="outline" onClick={() => retry(item.id)}><RefreshCw /> Retry</Button> : null}<Button nativeButton={false} render={<a href="http://localhost:3000/clients" target="_blank" rel="noreferrer" />} variant="outline"><ExternalLink /> Open CST</Button></div></div></div>)}</CardContent></Card><div className="space-y-4"><Card className="bg-card/90"><CardHeader><CardTitle>CST capacity</CardTitle><CardDescription>Live assignment context exposed by CST CRM.</CardDescription></CardHeader><CardContent className="space-y-5">{[["Sarah Khan", 11, 15], ["Michael Ross", 14, 15], ["Nadia Ali", 8, 15]].map(([name, active, max]) => <div key={name as string}><div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><UserRoundCheck className="size-4 text-primary" />{name}</span><span className="font-mono text-xs">{active}/{max}</span></div><Progress value={Number(active) / Number(max) * 100} className="h-1.5" /></div>)}</CardContent></Card><Card className="border-emerald-500/20 bg-emerald-500/[0.05]"><CardContent className="p-5"><p className="font-medium text-emerald-700 dark:text-emerald-300">Integration connected</p><p className="mt-2 text-xs leading-5 text-muted-foreground">CST receives customer identity, services, amounts, paid date, closer chain, and handler assignment.</p></CardContent></Card></div></div>;
}
