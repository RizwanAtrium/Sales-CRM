import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { requireActiveUser } from "@/lib/require-user";
import { etDateString, etDayRange } from "@/lib/et-time";
import { AttendanceLog } from "@/models/attendance-log";
import { Lead } from "@/models/lead";
import { User } from "@/models/user";
import { activeLeadFilter } from "@/lib/pipeline-access";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function POST(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return clearSessionCookie(NextResponse.json({ ok: true }));
  const body = await request.json().catch(() => ({}));
  const reason = ["Break", "Shift End", "Other"].includes(body.reason) ? body.reason : "";
  if (!reason) return NextResponse.json({ error: "Logout reason required" }, { status: 400 });

  if (user.role === "AGENT") {
    const today = etDayRange();
    const pending = await Lead.countDocuments({
      assignedAgent: user.sub,
      reachBackDate: { $gte: today.start, $lte: today.end },
      ...activeLeadFilter,
    });
    if (pending) return NextResponse.json({ error: `Complete ${pending} due callbacks before logout`, pendingCallbacks: pending }, { status: 409 });
  }

  await AttendanceLog.create({ user: user.sub, type: "LOGOUT", at: new Date(), etDate: etDateString(), reason });
  await User.findByIdAndUpdate(user.sub, { availabilityStatus: reason === "Break" ? "BREAK" : "OFFLINE" });
  return clearSessionCookie(NextResponse.json({ ok: true }));
}

export async function GET(request: NextRequest) {
  return clearSessionCookie(NextResponse.redirect(new URL("/login?logout=1", request.url)));
}
