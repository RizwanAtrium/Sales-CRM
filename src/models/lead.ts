import { Schema, model, models, type InferSchemaType } from "mongoose";

const ownershipSchema = new Schema(
  {
    previousOwner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    newOwner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const leadSchema = new Schema(
  {
    leadSource: { type: String, required: true, trim: true, index: true },
    customerName: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    mobileNumber: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    businessAddress: { type: String, trim: true, default: "" },
    niche: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    reachBackDate: {
      type: Date,
      required: function (this: { status: string }) {
        return !["CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED", "ARCHIVED"].includes(this.status);
      },
      default: null,
      index: true,
    },
    reachBackTimeZone: { type: String, default: "America/New_York", trim: true },
    lastReachBackNotificationAt: { type: Date, default: null },
    assignedAgent: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "SUBMITTED", "APPROVED", "UNAPPROVED", "IN_PROGRESS", "CLOSED_WON", "CLOSED_LOST", "NOT_INTERESTED", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    terminalAt: { type: Date, default: null },
    ownershipHistory: { type: [ownershipSchema], default: [] },
  },
  { timestamps: true },
);

leadSchema.index({ assignedAgent: 1, status: 1, reachBackDate: 1 });
leadSchema.index({ businessName: "text", customerName: "text", phoneNumber: "text", email: "text" });

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const Lead = models.Lead || model("Lead", leadSchema);
