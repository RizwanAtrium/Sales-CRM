import { Schema, model, models } from "mongoose";

const catalogItemSchema = new Schema(
  {
    type: { type: String, enum: ["SERVICE", "LEAD_SOURCE"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

catalogItemSchema.index({ type: 1, name: 1 }, { unique: true });
export const CatalogItem = models.CatalogItem || model("CatalogItem", catalogItemSchema);
