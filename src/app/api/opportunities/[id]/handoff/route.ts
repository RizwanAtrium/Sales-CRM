import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { createOrDeliverCstHandoff } from "@/lib/handoff-service";

const schema = z.object({ cstManagerId: z.string().optional(), workStartDate: z.coerce.date().optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    const { handoff, delivery } = await createOrDeliverCstHandoff({
      opportunityId: id,
      actor: user,
      workStartDate: input.workStartDate,
      forceStageForward: true,
    });
    return NextResponse.json({ item: handoff, delivery });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Handoff validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to create handoff" }, { status: 500 });
  }
}
