import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { User } from "@/models/user";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    await connectToDatabase();
    const user = await User.findOne({ email: input.email, active: true }).select("+passwordHash");
    if (!user || !(await compare(input.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    user.lastLoginAt = new Date();
    await user.save();
    await recordAudit({ actorId: user.id, actorName: user.name, action: "LOGIN", targetType: "USER", targetId: user.id });

    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid login data", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
