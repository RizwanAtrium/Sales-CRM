import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { DailyCallStat } from "@/models/daily-call-stat";
import { User } from "@/models/user";

const callStatSchema = z.object({
  date: z.coerce.date(),
  agent: z.string().optional(),
  callsMade: z.number().int().min(0),
  connected: z.number().int().min(0),
  conversationsTwoMinutes: z.number().int().min(0),
  callsBooked: z.number().int().min(0),
  approved: z.number().int().min(0),
  noShows: z.number().int().min(0),
  notes: z.string().optional().default(""),
  offDay: z.boolean().optional().default(false),
});

const approvalSchema = z.object({ id: z.string(), status: z.enum(["APPROVED", "REJECTED"]) });

type LeanUser = { _id: Types.ObjectId; name: string; email: string; role: string; teamLead?: Types.ObjectId | null; manager?: Types.ObjectId | null; active: boolean };
type PopulatedUser = { _id?: Types.ObjectId; name?: string; email?: string; role?: string; teamLead?: Types.ObjectId | string | null; manager?: Types.ObjectId | string | null };
type LeanCallStat = {
  _id: Types.ObjectId;
  status?: string;
  callsMade?: number;
  connected?: number;
  conversationsTwoMinutes?: number;
  callsBooked?: number;
  approved?: number;
  noShows?: number;
  agent?: PopulatedUser;
};

function sameId(a?: unknown, b?: unknown) {
  return String(a || "") === String(b || "");
}

async function getVisibleUsers(user: { sub: string; role: string }) {
  const users = (await User.find({ active: true }).select("name email role teamLead manager active").sort({ role: 1, name: 1 }).lean()) as unknown as LeanUser[];
  if (user.role === "SUPER_ADMIN") return users;
  if (user.role === "MANAGER") {
    const teamLeadIds = users.filter((item) => item.role === "TEAM_LEAD" && sameId(item.manager, user.sub)).map((item) => String(item._id));
    return users.filter((item) => sameId(item._id, user.sub) || sameId(item.manager, user.sub) || teamLeadIds.includes(String(item.teamLead || "")));
  }
  if (user.role === "TEAM_LEAD") return users.filter((item) => sameId(item._id, user.sub) || sameId(item.teamLead, user.sub));
  return users.filter((item) => sameId(item._id, user.sub));
}

function canSubmitFor(actor: { sub: string; role: string }, target?: LeanUser | null) {
  if (!target) return false;
  if (actor.role === "SUPER_ADMIN") return true;
  if (actor.role === "MANAGER") return sameId(target._id, actor.sub) || sameId(target.manager, actor.sub);
  if (actor.role === "TEAM_LEAD") return sameId(target._id, actor.sub) || sameId(target.teamLead, actor.sub);
  return sameId(target._id, actor.sub);
}

function defaultStatus(actor: { sub: string; role: string }, target?: LeanUser | null) {
  if (!target) return "PENDING";
  if (actor.role === "SUPER_ADMIN") return "APPROVED";
  if (target.role === "AGENT") return actor.role === "TEAM_LEAD" || actor.role === "MANAGER" ? "APPROVED" : "PENDING";
  if (target.role === "TEAM_LEAD") return actor.role === "MANAGER" ? "APPROVED" : "PENDING";
  return actor.role === "SUPER_ADMIN" ? "APPROVED" : "PENDING";
}

function canApprove(actor: { sub: string; role: string }, target?: (LeanUser | PopulatedUser) | null) {
  if (!target) return false;
  if (actor.role === "SUPER_ADMIN") return true;
  if (target.role === "AGENT") return actor.role === "TEAM_LEAD" && sameId(target.teamLead, actor.sub) || actor.role === "MANAGER";
  if (target.role === "TEAM_LEAD") return actor.role === "MANAGER" && sameId(target.manager, actor.sub);
  return false;
}

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const selectedUsers = request.nextUrl.searchParams.get("users")?.split(",").filter(Boolean) || [];
  const selectedRole = request.nextUrl.searchParams.get("role") || "ALL";
  const selectedTeamLead = request.nextUrl.searchParams.get("teamLead") || "ALL";

  const visibleUsers = await getVisibleUsers(user);
  let allowedUsers = visibleUsers;
  if (selectedUsers.length) allowedUsers = allowedUsers.filter((item) => selectedUsers.includes(String(item._id)));
  if (selectedRole !== "ALL") allowedUsers = allowedUsers.filter((item) => item.role === selectedRole);
  if (selectedTeamLead !== "ALL") allowedUsers = allowedUsers.filter((item) => sameId(item.teamLead, selectedTeamLead) || sameId(item._id, selectedTeamLead));

  const allowedIds = allowedUsers.map((item) => item._id);
  const filter: Record<string, unknown> = { agent: { $in: allowedIds } };
  if (from || to) filter.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };

  const items = await DailyCallStat.find(filter).sort({ date: -1 }).populate("agent", "name email role teamLead manager").populate("submittedBy", "name role").populate("approvedBy", "name role").lean();
  const typedItems = items as unknown as LeanCallStat[];
  const approvedItems = typedItems.filter((item) => item.status === "APPROVED");
  const totals = approvedItems.reduce((acc, item) => {
    acc.callsMade += item.callsMade || 0;
    acc.connected += item.connected || 0;
    acc.conversationsTwoMinutes += item.conversationsTwoMinutes || 0;
    acc.callsBooked += item.callsBooked || 0;
    acc.approved += item.approved || 0;
    acc.noShows += item.noShows || 0;
    return acc;
  }, { callsMade: 0, connected: 0, conversationsTwoMinutes: 0, callsBooked: 0, approved: 0, noShows: 0 });

  const pending = typedItems.filter((item) => item.status === "PENDING" && canApprove(user, item.agent));
  return NextResponse.json({
    items,
    pending,
    totals,
    users: visibleUsers.map((item) => ({ id: String(item._id), name: item.name, email: item.email, role: item.role, teamLead: item.teamLead ? String(item.teamLead) : null, manager: item.manager ? String(item.manager) : null })),
    canFilterCloser: hasRole(user.role, "MANAGER"),
  });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = callStatSchema.parse(await request.json());
    const targetUserId = input.agent || user.sub;
    if (!Types.ObjectId.isValid(targetUserId)) return NextResponse.json({ error: "Invalid agent/user selection" }, { status: 400 });
    const visibleUsers = await getVisibleUsers(user);
    const targetUser = visibleUsers.find((item) => sameId(item._id, targetUserId));
    if (!canSubmitFor(user, targetUser)) return NextResponse.json({ error: "You cannot log numbers for this user" }, { status: 403 });

    const date = new Date(input.date);
    date.setUTCHours(0, 0, 0, 0);
    const status = defaultStatus(user, targetUser);
    const item = await DailyCallStat.findOneAndUpdate(
      { agent: targetUserId, date },
      { ...input, date, agent: targetUserId, submittedBy: user.sub, status, approvedBy: status === "APPROVED" ? user.sub : null, approvedAt: status === "APPROVED" ? new Date() : null },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    await recordAudit({ actorId: user.sub, actorName: user.name, action: status === "APPROVED" ? "SAVED_APPROVED_CALL_STATS" : "SUBMITTED_CALL_STATS", targetType: "DAILY_CALL_STAT", targetId: item.id, after: { ...input, agent: targetUserId, status } });
    return NextResponse.json({ item, status });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Call-stat validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to save call stats" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = approvalSchema.parse(await request.json());
    if (!Types.ObjectId.isValid(input.id)) return NextResponse.json({ error: "Invalid stat id" }, { status: 400 });
    const item = await DailyCallStat.findById(input.id).populate("agent", "name role teamLead manager");
    if (!item) return NextResponse.json({ error: "Call stat not found" }, { status: 404 });
    if (!canApprove(user, item.agent as PopulatedUser)) return NextResponse.json({ error: "You cannot approve this record" }, { status: 403 });
    item.status = input.status;
    item.approvedBy = input.status === "APPROVED" ? user.sub : null;
    item.approvedAt = input.status === "APPROVED" ? new Date() : null;
    await item.save();
    await recordAudit({ actorId: user.sub, actorName: user.name, action: `${input.status}_CALL_STATS`, targetType: "DAILY_CALL_STAT", targetId: item.id, after: { status: input.status } });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Approval validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to update approval" }, { status: 500 });
  }
}
