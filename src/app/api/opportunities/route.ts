import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";
import { Opportunity } from "@/models/opportunity";

const submitSchema = z.object({ leadId: z.string(), closerId: z.string().optional() });

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const filter = user.role === "AGENT" ? { $or: [{ setter: user.sub }, { closer: user.sub }] } : {};
  const items = await Opportunity.find(filter).sort({ dateSubmitted: -1 }).populate("lead", "customerName businessName").populate("setter closer", "name").lean();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = submitSchema.parse(await request.json());
    if (!Types.ObjectId.isValid(input.leadId)) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    const lead = await Lead.findById(input.leadId);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (user.role === "AGENT" && String(lead.assignedAgent) !== user.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const opportunity = await Opportunity.create({
      lead: lead.id,
      setter: user.sub,
      closer: input.closerId ?? null,
      stage: "SUBMITTED",
      dateSubmitted: now,
      stageHistory: [{ from: null, to: "SUBMITTED", actor: user.sub, changedAt: now }],
    });
    lead.status = "SUBMITTED";
    await lead.save();
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "SUBMITTED_APPOINTMENT", targetType: "OPPORTUNITY", targetId: opportunity.id, after: { leadId: lead.id } });
    return NextResponse.json({ item: opportunity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Submission validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to submit appointment" }, { status: 500 });
  }
}
