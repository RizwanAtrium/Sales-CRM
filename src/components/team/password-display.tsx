"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PasswordDisplay({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (password) {
      setVisible((value) => !value);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/password`);
      const data = await res.json();
      setPassword(data.passwordVisible ?? "Not available");
      setVisible(true);
    } catch {
      setPassword("Error loading password");
      setVisible(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">User password</p>
          <p className="mt-1 text-sm font-mono">{visible ? password : "********"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={toggle} disabled={loading}>
          {visible ? "Hide password" : loading ? "Loading..." : "Show password"}
        </Button>
      </div>
    </div>
  );
}
