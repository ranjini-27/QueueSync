import Occupancy from "../models/Occupancy.js";
import OccupancyLog from "../models/OccupancyLog.js";

/**
 * Applies one entry (+1) or exit (-1) event to the branch-wide counter and
 * appends it to the audit log. Returns the resulting occupancy.
 *
 * Uses an atomic $inc (with upsert, so the very first event ever received
 * self-heals the singleton doc into existence instead of needing a seed
 * script) rather than read-then-write, so two IR triggers arriving close
 * together from the ESP32 can never race and drop an update.
 */
export async function recordOccupancyEvent(direction) {
  const delta = direction === "entry" ? 1 : -1;

  let doc = await Occupancy.findOneAndUpdate(
    { _id: "branch" },
    { $inc: { current: delta } },
    { new: true, upsert: true }
  );

  // Sensor noise or a missed entry read shouldn't be able to push the
  // dashboard into a negative occupancy — clamp back to 0 rather than
  // rejecting the exit event outright.
  if (doc.current < 0) {
    doc = await Occupancy.findOneAndUpdate({ _id: "branch" }, { current: 0 }, { new: true });
  }

  await OccupancyLog.create({ direction, occupancyAfter: doc.current });

  return doc.current;
}

/** Current branch occupancy for the Admin Dashboard overview card. */
export async function getCurrentOccupancy() {
  const doc = await Occupancy.findById("branch");
  return doc?.current || 0;
}

// Rough branch capacity used only to turn the raw occupancy count into a
// Low / Medium / High / Crowded label for dashboard status pills. No
// existing model tracks a configurable capacity yet, so this stays a
// simple env-overridable constant rather than a new admin-managed field.
const BRANCH_CAPACITY = Number(process.env.BRANCH_CAPACITY) || 100;

function occupancyStatusFor(current) {
  const pct = (current / BRANCH_CAPACITY) * 100;
  if (pct < 25) return "Low";
  if (pct < 50) return "Medium";
  if (pct < 75) return "High";
  return "Crowded";
}

/**
 * Shared {current, capacity, status} shape used by every dashboard that
 * shows branch occupancy (Customer Dashboard, public queue dashboard,
 * Admin overview), so the Low/Medium/High/Crowded thresholds only live
 * in one place.
 */
export async function getOccupancySnapshot() {
  const current = await getCurrentOccupancy();
  return { current, capacity: BRANCH_CAPACITY, status: occupancyStatusFor(current) };
}
