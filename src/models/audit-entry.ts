import { Schema, model, models } from "mongoose";

const auditEntrySchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now, immutable: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    actorName: { type: String, required: true, immutable: true },
    action: { type: String, required: true, immutable: true, index: true },
    targetType: { type: String, required: true, immutable: true },
    targetId: { type: String, required: true, immutable: true },
    before: { type: Schema.Types.Mixed, default: null, immutable: true },
    after: { type: Schema.Types.Mixed, default: null, immutable: true },
    metadata: { type: Schema.Types.Mixed, default: null, immutable: true },
  },
  { versionKey: false },
);

auditEntrySchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
auditEntrySchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"], function () {
  throw new Error("Audit entries are append-only");
});

export const AuditEntry = models.AuditEntry || model("AuditEntry", auditEntrySchema);
