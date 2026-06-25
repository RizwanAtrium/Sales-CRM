import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/require-user";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";
import { Payment } from "@/models/payment";
import { DailyCallStat } from "@/models/daily-call-stat";
import { activeLeadFilter, leadVisibilityFilter, opportunityVisibilityFilter } from "@/lib/pipeline-access";
import { etDayRange } from "@/lib/et-time";

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const from = new Date(request.nextUrl.searchParams.get("from") ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const to = new Date(request.nextUrl.searchParams.get("to") ?? new Date());
  to.setHours(23, 59, 59, 999);
  const today = etDayRange();
  const dueFilter = await leadVisibilityFilter(user);
  const opportunityFilter = await opportunityVisibilityFilter(user);
  const statFilter = user.role === "AGENT" ? { agent: user.sub } : {};

  const [dueToday, overdue, submitted, approved, won, lost, revenue, stats] = await Promise.all([
    Lead.countDocuments({ ...dueFilter, reachBackDate: { $gte: today.start, $lte: today.end }, ...activeLeadFilter }),
    Lead.countDocuments({ ...dueFilter, reachBackDate: { $lt: today.start }, ...activeLeadFilter }),
    Opportunity.countDocuments({ ...opportunityFilter, dateSubmitted: { $gte: from, $lte: to } }),
    Opportunity.countDocuments({ ...opportunityFilter, dateApproved: { $gte: from, $lte: to } }),
    Opportunity.countDocuments({ ...opportunityFilter, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] }, dateClosedWon: { $gte: from, $lte: to } }),
    Opportunity.countDocuments({ ...opportunityFilter, stage: { $in: ["APPROVED_LOST", "CLOSED_LOST"] }, dateClosedLost: { $gte: from, $lte: to } }),
    Opportunity.aggregate([{ $match: { ...opportunityFilter, stage: { $in: ["APPROVED_WON", "CLOSED_WON"] }, dateClosedWon: { $gte: from, $lte: to } } }, { $group: { _id: null, total: { $sum: "$totalDealValue" } } }]),
    DailyCallStat.aggregate([{ $match: { ...statFilter, date: { $gte: from, $lte: to }, offDay: false } }, { $group: { _id: null, callsMade: { $sum: "$callsMade" }, connected: { $sum: "$connected" } } }]),
  ]);
  const callsMade = stats[0]?.callsMade ?? 0;
  const connected = stats[0]?.connected ?? 0;
  return NextResponse.json({
    range: { from, to },
    followUps: { dueToday, overdue },
    pipeline: { submitted, approved, won, lost },
    revenueCollected: revenue[0]?.total ?? 0,
    rates: { approval: submitted ? approved / submitted : 0, close: approved ? won / approved : 0, connect: callsMade ? connected / callsMade : 0 },
  });
}
