import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { RemovalRequest } from "@/models/removal-request";

const schema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), note: z.string().optional().default("") });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    const item = await RemovalRequest.findByIdAndUpdate(id, { status: input.decision, approver: user.sub, decidedAt: new Date(), decisionNote: input.note }, { new: true });
    if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: `REMOVAL_${input.decision}`, targetType: "REMOVAL_REQUEST", targetId: id, after: input });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Decision validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to save decision" }, { status: 500 });
  }
}
