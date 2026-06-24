import { ChartNoAxesCombined, CheckCircle2, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <main className="relative grid min-h-screen overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 surface-grid opacity-15" />
        <div className="absolute -right-24 top-24 size-80 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><ChartNoAxesCombined /></span><div><p className="font-semibold">TFD Sales CRM</p><p className="text-xs text-white/65">Revenue command center</p></div></div>
        <div className="relative max-w-xl">
          <div className="mb-5 flex items-center gap-2 text-sm text-white/75"><Sparkles className="size-4" /> Built for focused sales teams</div>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">Never lose another follow-up.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/70">One workspace for leads, callbacks, approvals, closing, payment collection, and CST handoff.</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">{["Automatic due queue", "Full ownership history", "Live conversion metrics", "Immutable audit trail"].map((feature) => <div key={feature} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-white/80" />{feature}</div>)}</div>
        </div>
        <p className="relative text-xs text-white/55">Bonjotech LLC · The Fine Dudes</p>
      </section>
      <section className="relative flex items-center justify-center p-5 sm:p-10">
        <div className="absolute right-5 top-5"><ThemeToggle /></div>
        <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-2xl shadow-primary/10 backdrop-blur-xl">
          <CardHeader className="p-7 pb-3"><div className="mb-5 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground lg:hidden"><ChartNoAxesCombined /></div><CardTitle className="text-2xl">Welcome back</CardTitle><CardDescription>Sign in with your TFD workspace credentials.</CardDescription></CardHeader>
          <CardContent className="p-7 pt-5"><LoginForm /><p className="mt-6 text-center text-xs text-muted-foreground">Access is logged and protected by role permissions.</p></CardContent>
        </Card>
      </section>
    </main>
  );
}
