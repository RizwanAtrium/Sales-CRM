import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/require-user";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: { ...user, _id: user.sub } });
}
