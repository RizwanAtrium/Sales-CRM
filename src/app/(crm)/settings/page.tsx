"use client";

import { Bell, Clock, Database, ListChecks, Save, Shield, UserRound, Users, Workflow } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/motion/animated-page";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function SettingsPage() {
  const save = (area: string) => toast.success(`${area} settings saved`);
  return (
    <AnimatedPage>
      <PageHeader title="System settings" description="Configure ET shifts, follow-up rules, targets, catalogs, and access policies." />
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general"><Workflow /> General</TabsTrigger>
          <TabsTrigger value="profile"><UserRound /> Profile</TabsTrigger>
          <TabsTrigger value="assignments"><Users /> Assignments</TabsTrigger>
          <TabsTrigger value="shifts"><Clock /> Shifts</TabsTrigger>
          <TabsTrigger value="catalog"><ListChecks /> Catalogs</TabsTrigger>
          <TabsTrigger value="notifications"><Bell /> Notifications</TabsTrigger>
          <TabsTrigger value="integration"><Database /> Integrations</TabsTrigger>
          <TabsTrigger value="security"><Shield /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>Business rules</CardTitle><CardDescription>All scheduling rules follow US Eastern Time.</CardDescription></CardHeader><CardContent className="max-w-2xl space-y-5">
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Business timezone</Label><Input defaultValue="America/New_York" readOnly /></div><div className="space-y-2"><Label>Week starts on</Label><Input defaultValue="Monday" /></div></div>
            <label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /><span><b className="block">Require callback date and time</b><span className="text-xs text-muted-foreground">Block every active lead save without ET callback scheduling.</span></span></label>
            <label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /><span><b className="block">Require callback disposition</b><span className="text-xs text-muted-foreground">Connected, no answer, voicemail, or reschedule clears a callback.</span></span></label>
            <Button onClick={() => save("General")}><Save /> Save changes</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>Profile and password</CardTitle><CardDescription>Update your workspace identity and login password.</CardDescription></CardHeader><CardContent className="max-w-2xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Name</Label><Input defaultValue="Asad" /></div><div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="asad@thefinedudes.com" /></div><div className="space-y-2"><Label>New password</Label><Input type="password" placeholder="Leave blank to keep current" /></div><div className="space-y-2"><Label>Confirm password</Label><Input type="password" /></div></div>
            <Button onClick={() => save("Profile")}><Save /> Save profile</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>Lead and closer reassignment</CardTitle><CardDescription>Move ownership while preserving history and hiding previous agent notes from the new agent.</CardDescription></CardHeader><CardContent className="max-w-2xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Current agent / closer</Label><select className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option>Sales Agent</option><option>Team Lead</option></select></div><div className="space-y-2"><Label>New agent / closer</Label><select className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option>Team Lead</option><option>Sales Agent</option></select></div></div>
            <Button onClick={() => toast.success("Selected ownership reassigned")}>Reassign selected records</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>Agent shifts and freeze approvals</CardTitle><CardDescription>Standard floor shift is 11:00 AM to 8:00 PM Eastern Time.</CardDescription></CardHeader><CardContent className="max-w-2xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Shift start ET</Label><Input type="time" defaultValue="11:00" /></div><div className="space-y-2"><Label>Shift end ET</Label><Input type="time" defaultValue="20:00" /></div></div>
            <label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /><span><b className="block">Freeze missed callback users</b><span className="text-xs text-muted-foreground">Team Lead or Manager approves them back in.</span></span></label>
            <Button onClick={() => toast.success("Frozen agent approved back in")}>Approve selected frozen agent</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>Admin-editable catalogs</CardTitle><CardDescription>Lead sources and services can change without code updates.</CardDescription></CardHeader><CardContent className="space-y-3">
            {["GMB", "Yelp", "Meta Ads Library", "Website", "SEO", "Ads Management", "AI Content Creation"].map((item) => <div key={item} className="flex items-center justify-between rounded-xl border p-3"><span className="text-sm font-medium">{item}</span><Button variant="ghost" size="sm" onClick={() => toast.info(`${item} editor opened`)}>Edit</Button></div>)}
            <Button variant="outline" onClick={() => toast.success("New catalog item added")}>+ Add item</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>Reminder delivery</CardTitle><CardDescription>V1 notifications are in-app only. No SMS, WhatsApp, or email API.</CardDescription></CardHeader><CardContent className="space-y-3">
            <label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /> In-app due and overdue callback alerts</label>
            <label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /> In-app late/early login alerts</label>
            <label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /> In-app appointment submitted/status alerts</label>
            <Button onClick={() => save("Notification")}><Save /> Save reminders</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="integration" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>MongoDB and CST integration</CardTitle><CardDescription>Environment-backed connections; secrets are never stored in the browser.</CardDescription></CardHeader><CardContent className="max-w-2xl space-y-4"><div className="space-y-2"><Label>MongoDB database</Label><Input value="Configured from MONGODB_URI" readOnly /></div><div className="space-y-2"><Label>CST handoff endpoint</Label><Input defaultValue="Separate CST CRM specification" readOnly /></div><Button onClick={() => save("Integration")}><Save /> Save integration</Button></CardContent></Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card className="bg-card/90"><CardHeader><CardTitle>Access and retention</CardTitle><CardDescription>Role inheritance, session, screenshot blocking, and audit policy.</CardDescription></CardHeader><CardContent className="space-y-3"><label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /> Preserve user records after deactivation</label><label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /> Append-only audit events</label><label className="flex items-center gap-3 rounded-xl border p-4 text-sm"><Checkbox defaultChecked /> Block screen capture shortcuts and page copying</label><Button onClick={() => save("Security")}><Save /> Save security</Button></CardContent></Card>
        </TabsContent>
      </Tabs>
    </AnimatedPage>
  );
}
