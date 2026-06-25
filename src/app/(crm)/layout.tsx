import { AppShell } from "@/components/shell/app-shell";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { canOpenPath } from "@/lib/roles";
import { headers } from "next/headers";
import { ScreenshotBlocker } from "@/components/security/screenshot-blocker";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const headerStore = await headers();
  const pathname = headerStore.get("x-current-path") ?? "/dashboard";
  if (!canOpenPath(user.role, pathname)) redirect("/dashboard?access=restricted");
  return (
    <>
      <ScreenshotBlocker />
      <AppShell user={user}>{children}</AppShell>
    </>
  );
}
