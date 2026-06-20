"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  FileClock,
  LayoutDashboard,
  Menu,
  PhoneCall,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Waypoints,
  ClipboardCheck,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import { canOpenPath, initials, roleLabels } from "@/lib/roles";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/follow-ups", label: "Follow-ups", icon: PhoneCall, badge: "38" },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Waypoints },
  { href: "/payments", label: "Payments", icon: CircleDollarSign },
  { href: "/call-stats", label: "Call stats", icon: Activity },
  { href: "/team", label: "Team", icon: Target },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/handoffs", label: "CST handoffs", icon: Send },
];

const adminNav = [
  { href: "/audit-log", label: "Audit log", icon: FileClock },
  { href: "/settings", label: "Settings", icon: Settings },
];

function visibleItems<T extends { href: string }>(items: T[], role?: SessionUser["role"]) {
  if (!role) return items;
  return items.filter((item) => canOpenPath(role, item.href));
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-1">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <ChartNoAxesCombined className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold leading-none">TFD Sales</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">Revenue command center</span>
      </span>
    </Link>
  );
}

function NavSection({ title, items, pathname }: { title: string; items: typeof nav; pathname: string }) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge ? (
                <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[10px]", active ? "bg-white/15" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Sidebar({ pathname, user }: { pathname: string; user?: SessionUser }) {
  const workspaceItems = visibleItems(nav, user?.role);
  const administrationItems = visibleItems(adminNav, user?.role);
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Sparkles className="size-3.5 text-primary" /> Today&apos;s focus
        </div>
        <p className="mt-2 text-2xl font-semibold">38</p>
        <p className="text-xs text-muted-foreground">follow-ups need attention</p>
      </div>
      <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto">
        <NavSection title="Workspace" items={workspaceItems} pathname={pathname} />
        {administrationItems.length ? <NavSection title="Administration" items={administrationItems} pathname={pathname} /> : null}
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-xs font-medium">June sales target</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>$84.3k</span><span>$120k</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[70%] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children, user }: { children: React.ReactNode; user?: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-sidebar/90 backdrop-blur-xl lg:block">
        <Sidebar pathname={pathname} user={user} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation" className="lg:hidden" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Sidebar pathname={pathname} user={user} />
            </SheetContent>
          </Sheet>

          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 bg-muted/45 pl-9"
              placeholder="Search leads, clients, or deals..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && search.trim()) router.push(`/leads?search=${encodeURIComponent(search.trim())}`);
              }}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden gap-1.5 px-2.5 py-1 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Live data
            </Badge>
            <ThemeToggle />
            <Button variant="outline" size="icon" aria-label="Notifications" className="relative" onClick={() => router.push("/notifications")}>
              <Bell />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500 ring-2 ring-background" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="h-10 gap-2 px-2" />}>
                <Avatar className="size-7"><AvatarFallback className="bg-primary/10 text-[11px] text-primary">{initials(user?.name ?? "Demo User")}</AvatarFallback></Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-medium leading-none">{user?.name ?? "Demo User"}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">{user?.role ? roleLabels[user.role] : "Demo Mode"}</span>
                </span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings?tab=general")}>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="surface-grid min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
