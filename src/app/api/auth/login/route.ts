import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { etDateString, loginPunctuality } from "@/lib/et-time";
import { AttendanceLog } from "@/models/attendance-log";
import { User } from "@/models/user";
import { createNotification } from "@/lib/notifications";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "MongoDB not configured" }, { status: 500 });
    }
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
    const now = new Date();
    const status = loginPunctuality(now, user.shiftStart);
    user.lastLoginAt = now;
    user.availabilityStatus = user.frozen ? "FROZEN" : "AVAILABLE";
    if (status === "LATE") user.lateLoginCount = (user.lateLoginCount || 0) + 1;
    await user.save();
    await AttendanceLog.create({ user: user.id, type: "LOGIN", at: now, etDate: etDateString(now), shiftStart: user.shiftStart, shiftEnd: user.shiftEnd, status });
    if (status === "LATE" || status === "EARLY") {
      const recipients = [user.teamLead, user.manager].filter(Boolean).map(String);
      await Promise.all(recipients.map((recipientId) => createNotification({
        recipientId,
        title: `${user.name} logged in ${status.toLowerCase().replace("_", " ")}`,
        detail: `${user.name} logged in at ${now.toLocaleString("en-US", { timeZone: "America/New_York" })} ET against shift start ${user.shiftStart}.`,
        href: `/team/${user.id}`,
        type: "Security",
        dedupeKey: `attendance:${user.id}:${status}:${etDateString(now)}`,
      })));
    }
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
