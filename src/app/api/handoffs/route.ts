import { NextResponse } from "next/server";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { Handoff } from "@/models/handoff";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  const items = await Handoff.find()
    .sort({ createdAt: -1 })
    .populate({ path: "opportunity", populate: { path: "lead", select: "businessName customerName" } })
    .populate("forwardingManager", "name email")
    .lean();
  return NextResponse.json({ items });
}
