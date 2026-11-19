import mongoose from "mongoose";

/**
 * A banking service offered at the branch (e.g. "Cash Deposit", "Loan").
 * Replaces the old hardcoded SERVICE_TYPES list (still exported from
 * Counter.js as a seed default) now that the admin manages services
 * dynamically: Token.service and Counter.servicesOffered both store the
 * service `name` as a plain string rather than a ref, keeping the join
 * simple and consistent with how Staff.counterAssigned already works.
 */
const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 60,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },
    // Inactive services stay in history (existing tokens keep their
    // `service` string) but are hidden from the Kiosk's service picker
    // and from Counter Management's "services offered" selector.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

serviceSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Service", serviceSchema);
