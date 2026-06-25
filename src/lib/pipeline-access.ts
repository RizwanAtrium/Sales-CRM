import { Types } from "mongoose";
import { User } from "@/models/user";
import type { SessionUser } from "@/lib/session";

export const agentPipelineStages = ["SUBMITTED", "IN_PROGRESS", "REJECTED", "REVERSED", "APPROVED"] as const;
export const closerPipelineStages = ["SUBMITTED", "IN_PROGRESS", "REJECTED", "REVERSED", "APPROVED", "APPROVED_WON", "APPROVED_LOST"] as const;
export const inactiveLeadStatuses = ["CLOSED_WON", "CLOSED_LOST", "APPROVED_WON", "APPROVED_LOST", "NOT_INTERESTED", "ARCHIVED"] as const;
export const activeLeadFilter = { status: { $nin: [...inactiveLeadStatuses] } };

export function normalizePipelineStage(stage: string) {
  const value = stage.toUpperCase().replaceAll(" ", "_").replaceAll("-", "_");
  if (value === "CLOSED_WON") return "APPROVED_WON";
  if (value === "CLOSED_LOST") return "APPROVED_LOST";
  return value === "CLOSER_IN_PROGRESS" ? "IN_PROGRESS" : value;
}

export function rolePipelineStages(role: SessionUser["role"] | undefined | null) {
  if (!role) return [...closerPipelineStages];
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

export async function visibleUserIdsFor(user: SessionUser) {
  return ownedUserIdsFor(user);
}

export async function userVisibilityFilter(user: SessionUser) {
  const ids = await visibleUserIdsFor(user);
  if (!ids) return {};
  return { _id: { $in: ids } };
}

export async function leadVisibilityFilter(user: SessionUser) {
  const ids = await visibleUserIdsFor(user);
  if (!ids) return {};
  return {
    $or: [
      { assignedAgent: { $in: ids } },
      { assignedTeamLead: { $in: ids } },
      { createdBy: { $in: ids } },
    ],
  };
}

export async function opportunityVisibilityFilter(user: SessionUser) {
  const ids = await ownedUserIdsFor(user);
  if (!ids) return {};
  return { $or: [{ setter: { $in: ids } }, { closer: { $in: ids } }, { teamLeadSnapshot: { $in: ids } }, { managerSnapshot: { $in: ids } }] };
}

export function canMoveOpportunityStage(role: SessionUser["role"], nextStage: string) {
  if (role === "AGENT") return false;
  if (role === "TEAM_LEAD") return ["IN_PROGRESS", "APPROVED", "REJECTED", "REVERSED", "APPROVED_WON", "APPROVED_LOST"].includes(nextStage);
  if (role === "MANAGER") return ["IN_PROGRESS", "APPROVED", "REJECTED", "REVERSED", "APPROVED_WON", "APPROVED_LOST", "FORWARDED_TO_CST"].includes(nextStage);
  return true;
}
