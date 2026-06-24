import { Schema, model, models } from "mongoose";

const chatThreadSchema = new Schema(
  {
    type: { type: String, enum: ["PRIVATE", "GROUP"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, trim: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  },
  { timestamps: true },
);

const chatMessageSchema = new Schema(
  {
    thread: { type: Schema.Types.ObjectId, ref: "ChatThread", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, default: "", trim: true },
    cardType: { type: String, enum: ["NONE", "APPOINTMENT_SUBMITTED", "APPOINTMENT_STATUS", "LEAD_ADDED"], default: "NONE" },
    appointment: { type: Schema.Types.ObjectId, ref: "Opportunity", default: null },
    lead: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

chatMessageSchema.index({ thread: 1, createdAt: -1 });
export const ChatThread = models.ChatThread || model("ChatThread", chatThreadSchema);
export const ChatMessage = models.ChatMessage || model("ChatMessage", chatMessageSchema);
