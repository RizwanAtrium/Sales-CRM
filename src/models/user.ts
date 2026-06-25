import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    passwordVisible: { type: String, default: "", select: false },
    role: { type: String, enum: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "AGENT"], required: true },
    active: { type: Boolean, default: true, index: true },
    availabilityStatus: { type: String, enum: ["OFFLINE", "AVAILABLE", "BREAK", "FROZEN"], default: "OFFLINE", index: true },
    frozen: { type: Boolean, default: false, index: true },
    frozenAt: { type: Date, default: null },
    frozenReason: { type: String, default: "", trim: true },
    shiftStart: { type: String, default: "11:00", trim: true },
    shiftEnd: { type: String, default: "20:00", trim: true },
    lateLoginCount: { type: Number, default: 0, min: 0 },
    teamLead: { type: Schema.Types.ObjectId, ref: "User", default: null },
    manager: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deactivatedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, active: 1 });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = models.User || model("User", userSchema);
