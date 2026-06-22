import { NextResponse } from "next/server";
import { getCstHandlers } from "@/lib/cst-integration";
import { requireActiveUser, hasRole } from "@/lib/require-user";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  try {
    return NextResponse.json({ items: await getCstHandlers() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CST CRM unavailable" }, { status: 503 });
  }
}
