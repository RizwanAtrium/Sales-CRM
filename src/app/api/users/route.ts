import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { User } from "@/models/user";

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  role: z.enum(["AGENT", "TEAM_LEAD", "MANAGER", "SUPER_ADMIN"]),
  teamLead: z.string().optional(),
  manager: z.string().optional(),
});

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await User.find().select("-passwordHash").sort({ active: -1, name: 1 }).lean() });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "TEAM_LEAD")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const input = createSchema.parse(await request.json());
    if (input.role === "TEAM_LEAD" && !hasRole(user.role, "MANAGER")) return NextResponse.json({ error: "Managers create Team Leads" }, { status: 403 });
    if (input.role === "MANAGER" && !hasRole(user.role, "SUPER_ADMIN")) return NextResponse.json({ error: "Super Admin creates Managers" }, { status: 403 });
    if (input.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
    if (input.role === "AGENT" && !input.teamLead) return NextResponse.json({ error: "Agent requires a Team Lead" }, { status: 400 });
    if (input.role === "TEAM_LEAD" && !input.manager) return NextResponse.json({ error: "Team Lead requires a Manager" }, { status: 400 });
    if (input.teamLead && !Types.ObjectId.isValid(input.teamLead)) return NextResponse.json({ error: "Invalid Team Lead" }, { status: 400 });
    if (input.manager && !Types.ObjectId.isValid(input.manager)) return NextResponse.json({ error: "Invalid Manager" }, { status: 400 });
    if (input.teamLead) {
      const teamLead = await User.findOne({ _id: input.teamLead, role: "TEAM_LEAD", active: true }).select("_id").lean();
      if (!teamLead) return NextResponse.json({ error: "Selected Team Lead is not active" }, { status: 400 });
    }
    if (input.manager) {
      const manager = await User.findOne({ _id: input.manager, role: { $in: ["MANAGER", "SUPER_ADMIN"] }, active: true }).select("_id").lean();
      if (!manager) return NextResponse.json({ error: "Selected Manager is not active" }, { status: 400 });
    }
    const hierarchy = { teamLead: input.role === "AGENT" ? input.teamLead : null, manager: input.role === "TEAM_LEAD" ? input.manager : null };
    const created = await User.create({ ...input, ...hierarchy, passwordHash: await hash(input.password, 12), passwordVisible: input.password, password: undefined, active: true });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "CREATED_USER", targetType: "USER", targetId: created.id, after: { name: created.name, email: created.email, role: created.role } });
    return NextResponse.json({ item: { id: created.id, name: created.name, email: created.email, role: created.role, active: created.active } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "User validation failed", issues: error.issues }, { status: 400 });
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
