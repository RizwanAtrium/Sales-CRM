import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { RemovalRequest } from "@/models/removal-request";
import { User } from "@/models/user";
import { Lead } from "@/models/lead";

const decisionSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  try {
    const input = decisionSchema.parse(await request.json());
    const item = await RemovalRequest.findOne({ _id: id, status: "PENDING" });
    if (!item) return NextResponse.json({ error: "Pending request not found" }, { status: 404 });
    item.status = input.decision;
    item.approver = user.sub;
    item.decidedAt = new Date();
    await item.save();
    if (input.decision === "APPROVED") {
      if (item.targetType === "USER" && Types.ObjectId.isValid(item.targetId)) await User.findByIdAndUpdate(item.targetId, { active: false, deactivatedAt: new Date() });
      if (item.targetType === "LEAD" && Types.ObjectId.isValid(item.targetId)) await Lead.findByIdAndUpdate(item.targetId, { status: "ARCHIVED", terminalAt: new Date() });
    }
    await recordAudit({ actorId: user.sub, actorName: user.name, action: `${input.decision}_REMOVAL`, targetType: item.targetType, targetId: item.targetId, after: { requestId: item.id } });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid decision", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to decide request" }, { status: 500 });
  }
}
