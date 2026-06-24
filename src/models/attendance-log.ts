import { Schema, model, models } from "mongoose";

const attendanceLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["LOGIN", "LOGOUT"], required: true, index: true },
    at: { type: Date, default: Date.now, index: true },
    etDate: { type: String, required: true, index: true },
    shiftStart: { type: String, default: "11:00" },
    shiftEnd: { type: String, default: "20:00" },
    status: { type: String, enum: ["EARLY", "ON_TIME", "LATE", "NORMAL"], default: "NORMAL" },
    reason: { type: String, enum: ["Break", "Shift End", "Other", ""], default: "" },
  },
  { timestamps: true },
);

attendanceLogSchema.index({ user: 1, etDate: 1, type: 1 });
export const AttendanceLog = models.AttendanceLog || model("AttendanceLog", attendanceLogSchema);
