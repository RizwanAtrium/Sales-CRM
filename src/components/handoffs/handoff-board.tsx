"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Send, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type HandoffItem = {
  _id: string;
  client: string;
  services: string;
  value: string;
  handler: string;
  status: string;
};

export function HandoffBoard() {
  const [handoffs, setHandoffs] = useState<HandoffItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/handoffs", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setHandoffs(data.items ?? []))
      .catch(() => setHandoffs([]))
      .finally(() => setLoading(false));
  }, []);

  function retry(id: string) {
    fetch(`/api/handoffs/${id}/retry`, { method: "POST" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(() => {
        setHandoffs((current) => current.map((item) => item._id === id ? { ...item, status: "Delivered" } : item));
        toast.success("CST delivery retried");
      })
      .catch(() => toast.error("Retry failed"));
  }

  return <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"><Card className="bg-card/90"><CardHeader><CardTitle>Handoff delivery log</CardTitle><CardDescription>Idempotent transfer status from Sales CRM to CST CRM.</CardDescription></CardHeader><CardContent className="space-y-3">{loading ? <div className="p-6 text-center text-sm text-muted-foreground">Loading handoffs...</div> : handoffs.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No handoffs yet. Won deals that are paid in full appear here.</div> : handoffs.map((item) => <div key={item._id} className="rounded-xl border p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Send className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.client}</p><Badge variant={item.status === "Failed" ? "destructive" : item.status === "Delivered" ? "default" : "secondary"}>{item.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.services} · {item.value}</p></div><div className="text-sm"><p className="text-xs text-muted-foreground">CST owner</p><p className="font-medium">{item.handler}</p></div><div className="flex gap-2">{item.status === "Failed" ? <Button variant="outline" onClick={() => retry(item._id)}><RefreshCw /> Retry</Button> : null}<Button nativeButton={false} render={<a href="http://localhost:3000/clients" target="_blank" rel="noreferrer" />} variant="outline"><ExternalLink /> Open CST</Button></div></div></div>)}</CardContent></Card><div className="space-y-4"><Card className="bg-card/90"><CardHeader><CardTitle>CST capacity</CardTitle><CardDescription>Live assignment context exposed by CST CRM.</CardDescription></CardHeader><CardContent className="space-y-5"><p className="text-sm text-muted-foreground">Capacity data loads from CST integration.</p></CardContent></Card><Card className="border-emerald-500/20 bg-emerald-500/[0.05]"><CardContent className="p-5"><p className="font-medium text-emerald-700 dark:text-emerald-300">Integration connected</p><p className="mt-2 text-xs leading-5 text-muted-foreground">CST receives customer identity, services, amounts, paid date, closer chain, and handler assignment.</p></CardContent></Card></div></div>;
}
