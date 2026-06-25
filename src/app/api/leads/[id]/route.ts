import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";
import { hasMinimumRole } from "@/lib/roles";
import { leadVisibilityFilter } from "@/lib/pipeline-access";

const updateSchema = z.object({ customerName: z.string().optional(), businessName: z.string().optional(), phoneNumber: z.string().optional(), email: z.string().optional(), reachBackDate: z.coerce.date().optional(), reachBackTimeZone: z.string().optional(), notes: z.string().optional(), assignedAgent: z.string().optional(), status: z.string().optional() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const input = updateSchema.parse(await request.json());
    const visibility = await leadVisibilityFilter(user);
    const lead = await Lead.findOne({ _id: id, ...visibility });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (input.assignedAgent && !hasMinimumRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Team Lead access required for reassignment" }, { status: 403 });
    if (input.status && !hasMinimumRole(user.role, "TEAM_LEAD")) delete input.status;
    const before = lead.toObject();
    if (input.assignedAgent && String(before.assignedAgent) !== input.assignedAgent) {
      const currentPrivate = lead.notes || "";
      if (currentPrivate) lead.privateNotesByAgent = { ...(lead.privateNotesByAgent ?? {}), [String(before.assignedAgent)]: currentPrivate };
      input.notes = "";
    }
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
