import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireActiveUser } from "@/lib/require-user";
import { Opportunity } from "@/models/opportunity";
import { Payment } from "@/models/payment";
import { Handoff } from "@/models/handoff";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
  const item = await Opportunity.findById(id)
    .populate("lead")
    .populate("setter closer teamLeadSnapshot managerSnapshot", "name email role")
    .lean();
  if (!item) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  const [payments, handoff] = await Promise.all([
    Payment.find({ opportunity: id, voidedAt: null }).sort({ receivedAt: -1 }).populate("enteredBy", "name").lean(),
    Handoff.findOne({ opportunity: id }).lean(),
  ]);
  return NextResponse.json({ item: { ...item, payments, handoff } });
}
