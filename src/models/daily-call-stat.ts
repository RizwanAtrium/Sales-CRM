import { Schema, model, models } from "mongoose";

const dailyCallStatSchema = new Schema(
  {
    date: { type: Date, required: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    callsMade: { type: Number, min: 0, default: 0 },
    connected: { type: Number, min: 0, default: 0 },
    conversationsTwoMinutes: { type: Number, min: 0, default: 0 },
    callsBooked: { type: Number, min: 0, default: 0 },
    approved: { type: Number, min: 0, default: 0 },
    noShows: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: "", trim: true },
    offDay: { type: Boolean, default: false },
  },
  { timestamps: true },
);

dailyCallStatSchema.index({ agent: 1, date: 1 }, { unique: true });
dailyCallStatSchema.index({ status: 1, date: -1 });
export const DailyCallStat = models.DailyCallStat || model("DailyCallStat", dailyCallStatSchema);
