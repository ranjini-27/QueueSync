import "dotenv/config";
import bcrypt from "bcrypt";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

/**
 * Creates (or updates the password of) the branch admin account from
 * env vars. Run with: npm run seed:admin
 * There is no public admin registration endpoint by design.
 */
async function run() {
  await connectDB();

  const name = process.env.SEED_ADMIN_NAME || "Branch Administrator";
  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("[seed] SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);

  const admin = await Admin.findOneAndUpdate(
    { email },
    { name, email, passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[seed] Admin account ready: ${admin.email}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
