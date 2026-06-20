import { Schema, model, models } from "mongoose";

const removalRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approver: { type: Schema.Types.ObjectId, ref: "User", default: null },
    targetType: { type: String, enum: ["USER", "LEAD", "DEAL"], required: true },
    targetId: { type: String, required: true },
    reason: { type: String, default: "", trim: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const RemovalRequest = models.RemovalRequest || model("RemovalRequest", removalRequestSchema);
