import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";

const updateSchema = z.object({ customerName: z.string().optional(), businessName: z.string().optional(), phoneNumber: z.string().optional(), email: z.string().optional(), reachBackDate: z.coerce.date().optional(), reachBackTimeZone: z.string().optional(), notes: z.string().optional(), assignedAgent: z.string().optional(), status: z.string().optional() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const input = updateSchema.parse(await request.json());
    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (user.role === "AGENT" && String(lead.assignedAgent) !== user.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const before = lead.toObject();
    Object.assign(lead, input);
    if (input.assignedAgent && String(before.assignedAgent) !== input.assignedAgent) lead.ownershipHistory.push({ previousOwner: before.assignedAgent, newOwner: input.assignedAgent, changedBy: user.sub, changedAt: new Date() });
    await lead.save();
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "UPDATED_LEAD", targetType: "LEAD", targetId: id, before, after: lead.toObject() });
    return NextResponse.json({ item: lead });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Lead update validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to update lead" }, { status: 500 });
  }
}
