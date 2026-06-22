import { NextResponse } from "next/server";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { AuditEntry } from "@/models/audit-entry";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await AuditEntry.find().sort({ timestamp: -1 }).limit(5000).lean();
  const csv = ["timestamp,actor,action,targetType,targetId", ...rows.map((r) => [r.timestamp?.toISOString(), r.actorName, r.action, r.targetType, r.targetId].map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=audit-log.csv" } });
}
