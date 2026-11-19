import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    // e.g. "A021" — prefix from the owning counter + a daily sequence.
    tokenNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    // No enum: services are managed dynamically by the admin (Module 4 /
    // Service model), so this can't be pinned to a fixed list anymore.
    service: {
      type: String,
      required: true,
    },
    counter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Counter",
      required: true,
    },
    // Null for walk-in tokens generated at the Smart Kiosk (Module 5)
    // without a customer account.
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    status: {
      type: String,
      // "cancelled" is distinct from "skipped": skipped = staff no-show
      // during service; cancelled = admin performed a Reset Today's Queue
      // (Module 4) while this token was still waiting/serving.
      enum: ["waiting", "serving", "completed", "skipped", "transferred", "cancelled"],
      default: "waiting",
    },
    servedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    calledAt: { type: Date, default: null },
    servingStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    skippedAt: { type: Date, default: null },

    // Snapshot taken when the token is generated / whenever its position
    // in the queue changes. The customer-facing UI (Module 2) reads this
    // directly rather than recomputing queue position client-side.
    estimatedWaitMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    transferHistory: [
      {
        fromCounter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
        toCounter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      },
    ],

    // Lightweight audit log satisfying the "Store database log" requirement
    // on every CALL NEXT / RECALL / SKIP / PAUSE / RESUME action, without a
    // separate QueueLogs collection.
    statusHistory: [
      {
        status: { type: String },
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      },
    ],
  },
  { timestamps: true }
);

// Fast lookup of "today's waiting queue for counter X, oldest first".
tokenSchema.index({ counter: 1, status: 1, createdAt: 1 });
// Fast lookup of "today's tokens for counter X" for stats + numbering.
tokenSchema.index({ counter: 1, createdAt: 1 });

tokenSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Token", tokenSchema);
