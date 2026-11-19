import mongoose from "mongoose";

/**
 * One row per IR-sensor crossing detected by the ESP32 Occupancy Unit.
 * Pure audit trail — the live headline number lives on Occupancy.js so
 * the dashboard never has to replay this collection to answer "what's
 * the occupancy right now".
 */
const occupancyLogSchema = new mongoose.Schema(
  {
    direction: {
      type: String,
      enum: ["entry", "exit"],
      required: true,
    },
    // Snapshot of the branch-wide counter immediately after this event,
    // so historical rows are self-describing without a join.
    occupancyAfter: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// Fast "today's occupancy events, in order" lookup for reports.
occupancyLogSchema.index({ createdAt: 1 });

occupancyLogSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("OccupancyLog", occupancyLogSchema);
