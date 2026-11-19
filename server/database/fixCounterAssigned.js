import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Staff from "../models/Staff.js";

/**
 * One-off fix: some staff registered with a bare number (e.g. "1")
 * in counterAssigned instead of the expected "Counter 1" label,
 * which breaks the exact-name join against the Counter collection.
 *
 * Run with: node database/fixCounterAssigned.js
 */
async function run() {
  await connectDB();

  const staffList = await Staff.find({});
  for (const staff of staffList) {
    const raw = staff.counterAssigned.trim();

    // If it's already "Counter N" (any case), leave it alone.
    if (/^counter\s+\d+$/i.test(raw)) continue;

    // If it's just a bare number like "1", normalize to "Counter 1".
    if (/^\d+$/.test(raw)) {
      const fixed = `Counter ${raw}`;
      console.log(`[fix] ${staff.staffId}: "${raw}" -> "${fixed}"`);
      staff.counterAssigned = fixed;
      await staff.save();
    } else {
      console.log(`[skip] ${staff.staffId}: "${raw}" doesn't match a known pattern, leaving as-is`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[fix] Failed:", err);
  process.exit(1);
});
