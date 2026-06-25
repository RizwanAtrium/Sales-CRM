import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/require-user";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { Payment } from "@/models/payment";
import { leadVisibilityFilter, opportunityVisibilityFilter } from "@/lib/pipeline-access";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leadFilter = await leadVisibilityFilter(user);
  const opportunityFilter = await opportunityVisibilityFilter(user);
  const scopedOpportunities = await Opportunity.find(opportunityFilter).select("_id").lean<{ _id: unknown }[]>();
  const opportunityIds = scopedOpportunities.map((item) => item._id);
  const [leads, opportunities, payments] = await Promise.all([Lead.countDocuments(leadFilter), Opportunity.countDocuments(opportunityFilter), Payment.aggregate([{ $match: { voidedAt: null, opportunity: { $in: opportunityIds } } }, { $group: { _id: null, total: { $sum: "$amount" } } }])]);
  const csv = `metric,value\nLeads,${leads}\nOpportunities,${opportunities}\nRevenue,${payments[0]?.total ?? 0}\n`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=sales-dashboard.csv" } });
}
