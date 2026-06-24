import { AppShell } from "@/components/shell/app-shell";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/require-user";
import { canOpenPath } from "@/lib/roles";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireActiveUser();
  if (!user) redirect("/login");
  const headerStore = await headers();
  const pathname = headerStore.get("x-current-path") ?? "/dashboard";
  if (!canOpenPath(user.role, pathname)) redirect("/dashboard?access=restricted");
  return <AppShell user={user}>{children}</AppShell>;
}
