import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { User } from "@/models/user";

const schema = z.object({
  frozen: z.boolean().optional(),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Team Lead access required" }, { status: 403 });
  const { id } = await params;
  const input = schema.parse(await request.json());
  const update: Record<string, unknown> = { ...input };
  if (input.frozen === false) Object.assign(update, { frozenAt: null, frozenReason: "", availabilityStatus: "AVAILABLE" });
  if (input.frozen === true) Object.assign(update, { frozenAt: new Date(), availabilityStatus: "FROZEN" });
  const target = await User.findByIdAndUpdate(id, update, { new: true }).select("-passwordHash");
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await recordAudit({ actorId: user.sub, actorName: user.name, action: "UPDATED_USER_STATUS", targetType: "USER", targetId: id, after: input });
  return NextResponse.json({ item: target });
}
