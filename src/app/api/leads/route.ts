import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";

const createLeadSchema = z.object({
  leadSource: z.string().min(1),
  customerName: z.string().min(1),
  businessName: z.string().min(1),
  phoneNumber: z.string().min(5),
  mobileNumber: z.string().optional().default(""),
  email: z.union([z.string().email(), z.literal("")]).optional().default(""),
  businessAddress: z.string().optional().default(""),
  niche: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  reachBackDate: z.coerce.date(),
  assignedAgent: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 25), 1), 100);
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const queue = request.nextUrl.searchParams.get("queue");
  const filter: Record<string, unknown> = {};

  if (user.role === "AGENT") filter.assignedAgent = user.sub;
  if (queue === "due") {
    filter.reachBackDate = { $lte: new Date() };
    filter.status = { $nin: ["CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED", "ARCHIVED"] };
  }
  if (search) filter.$text = { $search: search };

  await connectToDatabase();
  const [items, total] = await Promise.all([
    Lead.find(filter).sort(queue === "due" ? { reachBackDate: 1 } : { createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("assignedAgent", "name email").lean(),
    Lead.countDocuments(filter),
  ]);
  return NextResponse.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = createLeadSchema.parse(await request.json());
    const assignedAgent = user.role === "AGENT" ? user.sub : input.assignedAgent ?? user.sub;
    await connectToDatabase();
    const lead = await Lead.create({
      ...input,
      assignedAgent,
      createdBy: user.sub,
      ownershipHistory: [{ previousOwner: null, newOwner: assignedAgent, changedBy: user.sub, changedAt: new Date() }],
    });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "CREATED_LEAD", targetType: "LEAD", targetId: lead.id, after: input });
    return NextResponse.json({ item: lead }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Lead validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to create lead" }, { status: 500 });
  }
}
