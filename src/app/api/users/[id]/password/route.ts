import { NextResponse } from "next/server";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { User } from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Only Super Admin can view passwords" }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();
  const target = await User.findById(id).select("passwordVisible name email role").lean();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    passwordVisible: (target as Record<string, unknown>).passwordVisible ?? "",
    name: (target as Record<string, unknown>).name,
    email: (target as Record<string, unknown>).email,
    role: (target as Record<string, unknown>).role,
  });
}
