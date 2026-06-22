import { Schema, model, models } from "mongoose";

const handoffSchema = new Schema(
  {
    opportunity: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, unique: true },
    forwardingManager: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cstManager: { type: String, required: true, default: "CST_MANAGER_QUEUE" },
    cstHandler: { type: String, default: null },
    payloadSnapshot: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["PENDING_ASSIGNMENT", "ASSIGNED", "DELIVERED", "FAILED"], default: "PENDING_ASSIGNMENT", index: true },
    forwardedAt: { type: Date, default: Date.now },
    assignedAt: { type: Date, default: null },
    externalReference: { type: String, default: null },
    lastError: { type: String, default: null },
  },
  { timestamps: true },
);

export const Handoff = models.Handoff || model("Handoff", handoffSchema);
