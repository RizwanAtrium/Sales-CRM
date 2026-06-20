import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "AGENT"], required: true },
    active: { type: Boolean, default: true, index: true },
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
