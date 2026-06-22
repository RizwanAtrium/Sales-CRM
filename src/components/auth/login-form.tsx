"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Unable to sign in");
    router.refresh();
    window.location.assign("/dashboard");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" placeholder="name@thefinedudes.com" required /></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><button type="button" className="text-xs font-medium text-primary">Forgot password?</button></div><Input id="password" name="password" type="password" minLength={8} required /></div>
      {error ? <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} Sign in to workspace</Button>
    </form>
  );
}
