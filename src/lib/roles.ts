import type { SessionUser } from "@/lib/session";

export type AppRole = SessionUser["role"];

export const roleLabels: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  TEAM_LEAD: "Team Lead",
  AGENT: "Agent",
};

export const roleWeights: Record<AppRole, number> = {
  AGENT: 1,
  TEAM_LEAD: 2,
  MANAGER: 3,
  SUPER_ADMIN: 4,
};

export function hasMinimumRole(role: string, minimum: AppRole) {
  return (roleWeights[role as AppRole] ?? 0) >= roleWeights[minimum];
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export function canOpenPath(role: AppRole, pathname: string) {
  const normalized = pathname === "/" ? "/dashboard" : pathname;
  const publicCrmPaths = ["/dashboard", "/notifications", "/chat"];
  if (publicCrmPaths.some((path) => normalized === path || normalized.startsWith(`${path}/`))) return true;

  if (role === "AGENT") {
    return ["/follow-ups", "/leads", "/pipeline", "/call-stats"].some((path) => normalized === path || normalized.startsWith(`${path}/`));
  }

  if (role === "TEAM_LEAD") {
    return ["/follow-ups", "/leads", "/pipeline", "/payments", "/call-stats", "/team", "/approvals", "/settings"].some((path) => normalized === path || normalized.startsWith(`${path}/`));
  }

  return true;
}
