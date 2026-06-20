import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const configured = Boolean(process.env.MONGODB_URI && process.env.JWT_SECRET);
  if (!configured) return NextResponse.json({ ok: true, database: "not_configured" });

  try {
    const connection = await connectToDatabase();
    return NextResponse.json({ ok: true, database: connection.connection.readyState === 1 ? "connected" : "connecting" });
  } catch {
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
