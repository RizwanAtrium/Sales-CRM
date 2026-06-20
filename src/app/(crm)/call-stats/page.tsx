"use client";

import { CalendarDays, Check, PhoneCall, Target, TrendingUp, Wifi } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const statFields = ["Calls made", "Connected", "Conversations 2 min+", "Calls booked", "Approved", "No shows"];

export default function CallStatsPage() {
  return (
    <AnimatedPage>
      <PageHeader title="Daily call activity" description="Log one activity record per agent, per day, and compare output against weekly targets." />
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Calls this week", value: "342", target: "500 target", progress: 68, icon: PhoneCall },
          { label: "Connected", value: "118", target: "150 target", progress: 79, icon: Wifi },
          { label: "Appointments", value: "28", target: "35 target", progress: 80, icon: CalendarDays },
          { label: "Connect rate", value: "34.5%", target: "+2.8%", progress: 72, icon: TrendingUp },
        ].map((item) => <Card key={item.label} className="bg-card/90"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p></div><item.icon className="size-5 text-primary" /></div><div className="mt-4 flex items-center gap-3"><Progress value={item.progress} className="h-1.5" /><span className="whitespace-nowrap text-[10px] text-muted-foreground">{item.target}</span></div></CardContent></Card>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/90">
          <CardHeader><CardTitle>Log today&apos;s numbers</CardTitle><CardDescription>Friday, June 20, 2026 · Uzma Khan</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const payload = {
                  date: new Date().toISOString(),
                  callsMade: Number(form.get("Calls made") || 0),
                  connected: Number(form.get("Connected") || 0),
                  conversationsTwoMinutes: Number(form.get("Conversations 2 min+") || 0),
                  callsBooked: Number(form.get("Calls booked") || 0),
                  approved: Number(form.get("Approved") || 0),
                  noShows: Number(form.get("No shows") || 0),
                  notes: String(form.get("observations") || ""),
                  offDay: Boolean(form.get("offDay")),
                };
                const response = await fetch("/api/call-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (response.ok) toast.success("Daily call stats saved");
                else toast.error((await response.json()).error || "Unable to save daily stats");
              }}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statFields.map((field, index) => <div key={field} className="space-y-2"><Label htmlFor={`stat-${index}`}>{field}</Label><Input id={`stat-${index}`} name={field} type="number" min="0" placeholder="0" /></div>)}
              </div>
              <div className="space-y-2"><Label htmlFor="observations">Notes / observations</Label><Textarea id="observations" name="observations" rows={4} placeholder="What worked, objections heard, and follow-up context..." /></div>
              <label className="flex items-center gap-2 text-sm"><Checkbox name="offDay" /> Mark today as an off-day</label>
              <div className="flex justify-end"><Button type="submit" size="lg"><Check /> Save daily stats</Button></div>
            </form>
          </CardContent>
        </Card>
        <Card className="bg-card/90">
          <CardHeader><CardTitle>Weekly targets</CardTitle><CardDescription>Actual performance for Jun 16–22</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {[
              ["Calls made", 342, 500], ["Connected", 118, 150], ["Conversations 2 min+", 82, 100], ["Calls booked", 28, 35], ["Approved", 19, 25],
            ].map(([label, actual, target]) => <div key={label as string}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="font-mono text-xs"><b>{actual}</b> / {target}</span></div><Progress value={(Number(actual) / Number(target)) * 100} className="h-1.5" /></div>)}
            <div className="rounded-xl border border-primary/15 bg-primary/[0.05] p-4"><div className="flex items-center gap-2 text-sm font-medium"><Target className="size-4 text-primary" /> On pace for 4 of 5 targets</div><p className="mt-1 text-xs text-muted-foreground">Increase call volume by 32/day to hit every target.</p></div>
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
