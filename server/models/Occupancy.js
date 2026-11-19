import mongoose from "mongoose";

/**
 * Singleton "how many people are in the branch right now" counter.
 * Kept separate from OccupancyLog (the append-only audit trail of every
 * entry/exit event) so reading the current headline number for the Admin
 * Dashboard is a single findById away instead of re-aggregating the whole
 * day's log on every poll. Always has exactly one document, _id "branch".
 */
const occupancySchema = new mongoose.Schema(
  {
    _id: { type: String, default: "branch" },
    current: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

occupancySchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Occupancy", occupancySchema);
