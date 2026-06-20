import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { RemovalRequest } from "@/models/removal-request";

const createSchema = z.object({
  targetType: z.enum(["USER", "LEAD", "DEAL"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3),
});

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await RemovalRequest.find().sort({ createdAt: -1 }).populate("requester approver", "name role").lean();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const input = createSchema.parse(await request.json());
    const item = await RemovalRequest.create({ ...input, requester: user.sub });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "REQUESTED_REMOVAL", targetType: input.targetType, targetId: input.targetId, after: { requestId: item.id, reason: input.reason } });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Removal request validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to request removal" }, { status: 500 });
  }
}
