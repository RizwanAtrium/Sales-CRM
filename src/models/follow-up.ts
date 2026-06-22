import { Schema, model, models } from "mongoose";

const followUpSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true, trim: true },
    previousReachBackDate: { type: Date, default: null },
    nextReachBackDate: { type: Date, default: null },
    nextReachBackTimeZone: { type: String, default: "America/New_York", trim: true },
    outcome: { type: String, enum: ["CONTINUE", "CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED"], required: true },
    handledAt: { type: Date, default: Date.now, immutable: true },
  },
  { timestamps: true },
);

followUpSchema.index({ lead: 1, handledAt: -1 });
export const FollowUp = models.FollowUp || model("FollowUp", followUpSchema);
