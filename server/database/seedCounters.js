import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Counter, { SERVICE_TYPES } from "../models/Counter.js";

/**
 * Provisions the branch's counters. Run with: npm run seed:counters
 *
 * IMPORTANT: Staff.counterAssigned is currently a free-typed string
 * (e.g. "Counter 1") captured at registration. The Staff Dashboard joins
 * staff -> counter by exact name match, so these `name` values must match
 * what staff type in at registration until Admin Dashboard (Module 4)
 * replaces free text with a dropdown of real counters.
 */
const COUNTERS = [
  { name: "Counter 1", counterNumber: 1, tokenPrefix: "A", servicesOffered: SERVICE_TYPES },
  { name: "Counter 2", counterNumber: 2, tokenPrefix: "B", servicesOffered: SERVICE_TYPES },
];

async function run() {
  await connectDB();

  for (const c of COUNTERS) {
    const counter = await Counter.findOneAndUpdate(
      { counterNumber: c.counterNumber },
      { $setOnInsert: c },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[seed] Counter ready: ${counter.name} (token prefix "${counter.tokenPrefix}")`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
