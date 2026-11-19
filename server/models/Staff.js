import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: [true, "Staff ID is required"],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    // Stored as a label for now (e.g. "Counter 1"). Once the Counter
    // Management module ships this becomes a ref to the Counters collection.
    counterAssigned: {
      type: String,
      required: [true, "Counter assignment is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    // Staff cannot log in until an admin approves the account.
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

staffSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Staff", staffSchema);
