"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCheck, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type NotificationItem = {
  _id: string;
  title: string;
  detail: string;
  href: string;
  type: "Follow-up" | "Approval" | "Payment" | "Security" | "System";
  read: boolean;
};

const fallback: NotificationItem[] = [
  { _id: "demo-1", title: "Follow-up monitoring is active", detail: "Missed reach-backs notify the owner, team lead, manager, and super admin.", href: "/follow-ups?filter=overdue", type: "Follow-up", read: false },
];

export function NotificationCenter() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load notifications")))
      .then((data) => { if (mounted) setItems(data.items ?? []); })
      .catch(() => { if (mounted) setItems(fallback); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const unread = items.filter((item) => !item.read).length;

  async function markRead(ids?: string[]) {
    setItems((current) => current.map((item) => (!ids || ids.includes(item._id)) ? { ...item, read: true } : item));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ids ? { ids } : { all: true }) }).catch(() => null);
  }

  return <Card className="bg-card/90"><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{loading ? "Loading notifications..." : `${unread} unread notifications`}</p><Button variant="outline" onClick={() => markRead()} disabled={loading || !items.length}>{loading ? <Loader2 className="animate-spin" /> : <CheckCheck />} Mark all read</Button></div><div className="space-y-3">{items.map((item) => <Link key={item._id} href={item.href} onClick={() => markRead([item._id])} className="flex gap-4 rounded-xl border p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{item.type === "Security" ? <ShieldCheck className="size-4" /> : item.type === "Follow-up" ? <Clock3 className="size-4" /> : <BellRing className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-medium">{item.title}</p>{!item.read ? <span className="size-2 rounded-full bg-primary" /> : null}</div><p className="mt-1 text-sm text-muted-foreground">{item.detail}</p></div><Badge variant="outline">{item.type}</Badge></Link>)}</div></CardContent></Card>;
}
