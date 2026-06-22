import { Schema, model, models } from "mongoose";

const weeklyTargetSchema = new Schema(
  {
    weekStart: { type: Date, required: true, index: true },
    metric: { type: String, enum: ["CALLS_MADE", "CONNECTED", "CONVERSATIONS_TWO_MINUTES", "CALLS_BOOKED", "APPROVED", "NO_SHOWS"], required: true },
    value: { type: Number, required: true, min: 0 },
    scope: { type: String, enum: ["COMPANY", "TEAM", "AGENT"], default: "COMPANY" },
    scopeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

weeklyTargetSchema.index({ weekStart: 1, metric: 1, scope: 1, scopeId: 1 }, { unique: true });
export const WeeklyTarget = models.WeeklyTarget || model("WeeklyTarget", weeklyTargetSchema);
