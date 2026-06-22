import { Types } from "mongoose";
import { User } from "@/models/user";
import type { SessionUser } from "@/lib/session";

export const agentPipelineStages = ["SUBMITTED", "IN_PROGRESS", "UNAPPROVED", "APPROVED"] as const;
export const closerPipelineStages = ["SUBMITTED", "IN_PROGRESS", "UNAPPROVED", "APPROVED", "CLOSER_IN_PROGRESS", "CLOSED_WON", "CLOSED_LOST"] as const;

export function normalizePipelineStage(stage: string) {
  const value = stage.toUpperCase().replaceAll(" ", "_").replaceAll("-", "_");
  if (value === "REJECTED" || value === "REVERSED") return "UNAPPROVED";
  return value === "CLOSER_IN_PROGRESS" ? "IN_PROGRESS" : value;
}

export function rolePipelineStages(role: SessionUser["role"]) {
  return role === "AGENT" ? [...agentPipelineStages] : [...closerPipelineStages];
}

export async function ownedUserIdsFor(user: SessionUser) {
  if (user.role === "SUPER_ADMIN") return null;
  const ownId = new Types.ObjectId(user.sub);
  if (user.role === "AGENT") return [ownId];

  if (user.role === "TEAM_LEAD") {
    const agents = await User.find({ active: true, teamLead: user.sub }).select("_id").lean<{ _id: Types.ObjectId }[]>();
    return [ownId, ...agents.map((agent) => agent._id)];
  }

  const directReports = await User.find({ active: true, manager: user.sub }).select("_id role").lean<{ _id: Types.ObjectId; role: string }[]>();
  const teamLeadIds = directReports.filter((person) => person.role === "TEAM_LEAD").map((person) => person._id);
  const agents = teamLeadIds.length ? await User.find({ active: true, teamLead: { $in: teamLeadIds } }).select("_id").lean<{ _id: Types.ObjectId }[]>() : [];
  return [ownId, ...directReports.map((person) => person._id), ...agents.map((agent) => agent._id)];
}

export async function opportunityVisibilityFilter(user: SessionUser) {
  const ids = await ownedUserIdsFor(user);
  if (!ids) return {};
  return { $or: [{ setter: { $in: ids } }, { closer: { $in: ids } }, { teamLeadSnapshot: { $in: ids } }, { managerSnapshot: { $in: ids } }] };
}

export function canMoveOpportunityStage(role: SessionUser["role"], nextStage: string) {
  if (role === "AGENT") return ["SUBMITTED", "IN_PROGRESS", "UNAPPROVED", "APPROVED"].includes(nextStage);
  if (role === "TEAM_LEAD") return ["IN_PROGRESS", "APPROVED", "UNAPPROVED", "CLOSED_WON", "CLOSED_LOST"].includes(nextStage);
  if (role === "MANAGER") return ["IN_PROGRESS", "APPROVED", "UNAPPROVED", "CLOSED_WON", "CLOSED_LOST", "FORWARDED_TO_CST"].includes(nextStage);
  return true;
}
