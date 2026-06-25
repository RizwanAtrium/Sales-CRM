import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { requireActiveUser } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { Lead } from "@/models/lead";
import { User } from "@/models/user";
import { activeLeadFilter, leadVisibilityFilter } from "@/lib/pipeline-access";

const createLeadSchema = z.object({
  leadSource: z.string().min(1),
  customerName: z.string().min(1),
  businessName: z.string().min(1),
  phoneNumber: z.string().min(5),
  mobileNumber: z.string().optional().default(""),
  email: z.union([z.string().email(), z.literal("")]).optional().default(""),
  businessAddress: z.string().optional().default(""),
  niche: z.string().min(1),
  price: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().default(""),
  reachBackDate: z.coerce.date(),
  reachBackTimeZone: z.string().optional().default("America/New_York"),
  assignedAgent: z.string().optional(),
  assignedTeamLead: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 25), 1), 100);
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const queue = request.nextUrl.searchParams.get("queue");
  const filter: Record<string, unknown> = await leadVisibilityFilter(user);
  if (queue === "due") {
    const { createMissedReachBackNotifications } = await import("@/lib/notifications");
    await createMissedReachBackNotifications();
    filter.reachBackDate = { $lte: new Date() };
    Object.assign(filter, activeLeadFilter);
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
    const owner = await User.findById(assignedAgent).select("teamLead role").lean<{ teamLead?: unknown; role?: string }>();
    const assignedTeamLead = input.assignedTeamLead === "SELF" ? owner?.teamLead ?? (owner?.role === "TEAM_LEAD" ? assignedAgent : undefined) : input.assignedTeamLead;
    const lead = await Lead.create({
      ...input,
      assignedAgent,
      assignedTeamLead,
      createdBy: user.sub,
      ownershipHistory: [{ previousOwner: null, newOwner: assignedAgent, changedBy: user.sub, changedAt: new Date() }],
    });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "CREATED_LEAD", targetType: "LEAD", targetId: lead.id, after: input });
    const { postLeadCreated } = await import("@/lib/chat-service");
    await postLeadCreated({
      senderId: user.sub,
      leadId: lead.id,
      customerName: input.customerName,
      businessName: input.businessName,
      service: input.niche || input.leadSource,
      value: input.price != null ? `$${Number(input.price).toLocaleString()}` : "TBD",
      status: lead.status,
      assignedAgentId: assignedAgent,
    });
    return NextResponse.json({ item: lead }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Lead validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to create lead" }, { status: 500 });
  }
}
