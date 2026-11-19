import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Service from "../models/Service.js";
import { SERVICE_TYPES } from "../models/Counter.js";

/**
 * Provisions the branch's default banking services. Run with:
 *   npm run seed:services
 *
 * Safe to re-run — existing services (matched by name) are left untouched.
 * Once seeded, the admin manages this list entirely through the Admin
 * Dashboard's Service Management screen (Module 4).
 */
async function run() {
  await connectDB();

  for (const name of SERVICE_TYPES) {
    const service = await Service.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[seed] Service ready: ${service.name}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
