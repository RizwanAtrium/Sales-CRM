import { Schema, model, models } from "mongoose";

const dailyCallStatSchema = new Schema(
  {
    date: { type: Date, required: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
export const DailyCallStat = models.DailyCallStat || model("DailyCallStat", dailyCallStatSchema);
