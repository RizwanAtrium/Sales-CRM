import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/require-user";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { Payment } from "@/models/payment";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [leads, opportunities, payments] = await Promise.all([Lead.countDocuments(), Opportunity.countDocuments(), Payment.aggregate([{ $match: { voidedAt: null } }, { $group: { _id: null, total: { $sum: "$amount" } } }])]);
  const csv = `metric,value\nLeads,${leads}\nOpportunities,${opportunities}\nRevenue,${payments[0]?.total ?? 0}\n`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=sales-dashboard.csv" } });
}
