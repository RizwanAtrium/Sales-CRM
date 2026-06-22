import { Schema, model, models } from "mongoose";

const paymentServiceLineSchema = new Schema(
  {
    serviceName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    opportunity: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    receivedAt: { type: Date, required: true, default: Date.now, index: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    closer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerSnapshot: {
      businessName: { type: String, required: true, trim: true },
      customerName: { type: String, required: true, trim: true },
      phoneNumber: { type: String, required: true, trim: true },
      mobileNumber: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    serviceLines: { type: [paymentServiceLineSchema], default: [] },
    totalSoldAmount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", trim: true },
    voidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ opportunity: 1, receivedAt: -1 });
paymentSchema.index({ "customerSnapshot.businessName": 1 });
export const Payment = models.Payment || model("Payment", paymentSchema);
