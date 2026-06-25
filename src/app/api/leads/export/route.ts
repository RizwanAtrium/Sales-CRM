import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/require-user";
import { Lead } from "@/models/lead";
import { leadVisibilityFilter } from "@/lib/pipeline-access";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const filter = await leadVisibilityFilter(user);
  const rows = await Lead.find(filter).sort({ createdAt: -1 }).populate("assignedAgent", "name email").lean();
  const csv = ["businessName,customerName,phoneNumber,email,leadSource,status,reachBackDate,assignedAgent", ...rows.map((r) => [r.businessName, r.customerName, r.phoneNumber, r.email, r.leadSource, r.status, r.reachBackDate?.toISOString(), (r.assignedAgent as { name?: string })?.name].map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=leads.csv" } });
}
