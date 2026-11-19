import mongoose from "mongoose";

// Master list of banking services a counter may offer. Shared with Token.js.
export const SERVICE_TYPES = [
  "Cash Deposit",
  "Cash Withdrawal",
  "Loan",
  "Passbook",
  "Account Opening",
  "Cheque",
  "Demand Draft",
  "Customer Service",
  "Locker",
  "Others",
];

const counterSchema = new mongoose.Schema(
  {
    // Human label staff registration currently free-types into
    // `Staff.counterAssigned` (e.g. "Counter 1"). Kept as the join key
    // until Admin Dashboard (Module 4) introduces a proper counter picker.
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    counterNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    // Derived once at seed time from counterNumber (1->A, 2->B, ...).
    // Used as the token prefix so tokens read "A021", "B015" etc,
    // matching the Centralized Queue Display spec.
    tokenPrefix: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    // No `enum` here on purpose: Module 4 (Admin Dashboard) manages the
    // list of banking services dynamically via the Service collection, so
    // this can no longer be constrained to the fixed SERVICE_TYPES list.
    // SERVICE_TYPES is retained only as the seed-time default below.
    servicesOffered: {
      type: [String],
      default: SERVICE_TYPES,
    },
    // offline  -> no staff currently on duty at this counter
    // active   -> staffed and accepting/serving tokens
    // paused   -> staffed but temporarily not calling new tokens
    status: {
      type: String,
      enum: ["offline", "active", "paused"],
      default: "offline",
    },
    staffOnDuty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    currentToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
      default: null,
    },
    // Rolling average service duration in seconds, used by the waiting-time
    // algorithm (avgServiceTimeSeconds * customersAhead). Updated as an
    // exponential moving average every time a token is completed, so it
    // continuously adapts to real historical service durations.
    avgServiceTimeSeconds: {
      type: Number,
      default: 600, // sane 10-minute default until real data accumulates
      min: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

counterSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Counter", counterSchema);
