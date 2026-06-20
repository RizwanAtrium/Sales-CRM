"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, CheckCheck, Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const initial = [
  { id: 1, title: "12 follow-ups are overdue", detail: "Oldest callback is four days late.", href: "/follow-ups?filter=overdue", type: "Follow-up", read: false },
  { id: 2, title: "4 appointments need approval", detail: "Submitted by Uzma and Rohan.", href: "/approvals", type: "Approval", read: false },
  { id: 3, title: "Carter Contracting is paid in full", detail: "The client can now be forwarded to CST.", href: "/pipeline/OP-452", type: "Payment", read: false },
  { id: 4, title: "Removal request pending", detail: "Manager decision required.", href: "/approvals", type: "Security", read: true },
];

export function NotificationCenter() {
  const [items, setItems] = useState(initial);
  const unread = items.filter((item) => !item.read).length;
  return <Card className="bg-card/90"><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{unread} unread notifications</p><Button variant="outline" onClick={() => setItems((current) => current.map((item) => ({ ...item, read: true })))}><CheckCheck /> Mark all read</Button></div><div className="space-y-3">{items.map((item) => <Link key={item.id} href={item.href} onClick={() => setItems((current) => current.map((row) => row.id === item.id ? { ...row, read: true } : row))} className="flex gap-4 rounded-xl border p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{item.type === "Security" ? <ShieldCheck className="size-4" /> : item.type === "Follow-up" ? <Clock3 className="size-4" /> : <BellRing className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-medium">{item.title}</p>{!item.read ? <span className="size-2 rounded-full bg-primary" /> : null}</div><p className="mt-1 text-sm text-muted-foreground">{item.detail}</p></div><Badge variant="outline">{item.type}</Badge></Link>)}</div></CardContent></Card>;
}
