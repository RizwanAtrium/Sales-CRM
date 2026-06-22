import { Schema, model, models, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Follow-up", "Approval", "Payment", "Security", "System"], default: "System", index: true },
    read: { type: Boolean, default: false, index: true },
    dedupeKey: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, dedupeKey: 1 }, { unique: true });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = models.Notification || model("Notification", notificationSchema);
