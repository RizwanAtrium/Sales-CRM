import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/session";
import { User } from "@/models/user";
import { hasMinimumRole } from "@/lib/roles";

export async function requireActiveUser() {
  const session = await getSessionUser();
  if (!session?.sub || !Types.ObjectId.isValid(session.sub)) return null;
  await connectToDatabase();
  const user = await User.findOne({ _id: session.sub, active: true }).lean();
  return user ? session : null;
}

export function hasRole(role: string, minimum: "AGENT" | "TEAM_LEAD" | "MANAGER" | "SUPER_ADMIN") {
  return hasMinimumRole(role, minimum);
}
