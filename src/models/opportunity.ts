import { Schema, model, models } from "mongoose";

const stageHistorySchema = new Schema(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const serviceLineSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "CatalogItem", default: null },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const opportunitySchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, unique: true },
    setter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    closer: { type: Schema.Types.ObjectId, ref: "User", default: null },
    teamLeadSnapshot: { type: Schema.Types.ObjectId, ref: "User", default: null },
    managerSnapshot: { type: Schema.Types.ObjectId, ref: "User", default: null },
    stage: { type: String, enum: ["SUBMITTED", "IN_PROGRESS", "REJECTED", "REVERSED", "APPROVED", "APPROVED_WON", "APPROVED_LOST", "UNAPPROVED", "CLOSED_WON", "CLOSED_LOST", "FORWARDED_TO_CST", "ARCHIVED"], default: "SUBMITTED", index: true },
    dateSubmitted: { type: Date, required: true, default: Date.now },
    dateApproved: { type: Date, default: null },
    dateClosedWon: { type: Date, default: null },
    dateClosedLost: { type: Date, default: null },
    dateForwarded: { type: Date, default: null },
    serviceLines: { type: [serviceLineSchema], default: [] },
    totalDealValue: { type: Number, default: 0, min: 0 },
    amountReceived: { type: Number, default: 0, min: 0 },
    amountToReceive: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["UNPAID", "PARTIAL", "PAID_IN_FULL"], default: "UNPAID" },
    datePaid: { type: Date, default: null },
    stageHistory: { type: [stageHistorySchema], default: [] },
  },
  { timestamps: true },
);

opportunitySchema.index({ stage: 1, dateSubmitted: -1 });
export const Opportunity = models.Opportunity || model("Opportunity", opportunitySchema);
