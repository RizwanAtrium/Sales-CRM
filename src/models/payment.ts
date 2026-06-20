import { Schema, model, models } from "mongoose";

const paymentSchema = new Schema(
  {
    opportunity: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    receivedAt: { type: Date, required: true, default: Date.now, index: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "", trim: true },
    voidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ opportunity: 1, receivedAt: -1 });
export const Payment = models.Payment || model("Payment", paymentSchema);
