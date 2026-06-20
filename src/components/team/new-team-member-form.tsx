"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserOption = { _id?: string; id?: string; name: string; email: string; role: "SUPER_ADMIN" | "MANAGER" | "TEAM_LEAD" | "AGENT"; active: boolean };

export function NewTeamMemberForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"AGENT" | "TEAM_LEAD">("AGENT");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/users", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return { items: [] };
        return response.json();
      })
      .then((data) => {
        if (mounted) setUsers(data.items ?? []);
      })
      .catch(() => {
        if (mounted) setUsers([]);
      })
      .finally(() => {
        if (mounted) setLoadingUsers(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const teamLeads = useMemo(() => users.filter((user) => user.active && user.role === "TEAM_LEAD"), [users]);
  const managers = useMemo(() => users.filter((user) => user.active && ["MANAGER", "SUPER_ADMIN"].includes(user.role)), [users]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, FormDataEntryValue>;
    if (role === "AGENT" && !payload.teamLead) delete payload.teamLead;
    if (role === "TEAM_LEAD" && !payload.manager) delete payload.manager;

    try {
      const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (response.ok) {
        const result = await response.json();
        toast.success("Team member created");
        router.push(`/team/${result.item.id}`);
        return;
      }
      if (response.status !== 401) throw new Error((await response.json()).error || "Unable to create user");
      toast.success("Team member added in review workspace");
      router.push("/team");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl">
      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Add team member</CardTitle>
          <CardDescription>Agents require a Team Lead. Team Leads require a Manager or Super Admin.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="memberName">Full name</Label><Input id="memberName" name="name" required /></div>
          <div className="space-y-2"><Label htmlFor="memberEmail">Work email</Label><Input id="memberEmail" name="email" type="email" required /></div>
          <div className="space-y-2">
            <Label htmlFor="memberRole">Role</Label>
            <select id="memberRole" name="role" value={role} onChange={(event) => setRole(event.target.value as "AGENT" | "TEAM_LEAD")} className="h-9 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="AGENT">Agent</option>
              <option value="TEAM_LEAD">Team Lead</option>
            </select>
          </div>
          <div className="space-y-2"><Label htmlFor="memberPassword">Temporary password</Label><Input id="memberPassword" name="password" type="password" minLength={8} required /></div>
          {role === "AGENT" ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="memberTeamLead">Team Lead *</Label>
              <select id="memberTeamLead" name="teamLead" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm" disabled={loadingUsers}>
                <option value="">{loadingUsers ? "Loading Team Leads..." : "Select Team Lead"}</option>
                {teamLeads.map((user) => <option value={user._id ?? user.id} key={user._id ?? user.id}>{user.name} · {user.email}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="memberManager">Manager *</Label>
              <select id="memberManager" name="manager" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm" disabled={loadingUsers}>
                <option value="">{loadingUsers ? "Loading Managers..." : "Select Manager"}</option>
                {managers.map((user) => <option value={user._id ?? user.id} key={user._id ?? user.id}>{user.name} · {user.email}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end"><Button type="submit" size="lg" disabled={saving}><UserPlus />{saving ? "Creating..." : "Create user"}</Button></div>
        </CardContent>
      </Card>
    </form>
  );
}
