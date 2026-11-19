import Counter from "../models/Counter.js";
import Token from "../models/Token.js";
import { startOfToday, endOfToday, getTodayStatsForCounter } from "./queueService.js";
import { getCurrentOccupancy } from "./occupancyService.js";

/**
 * Headline numbers for the Admin Dashboard's overview cards.
 *
 * currentOccupancy now reads from the ESP32 Occupancy Unit's live counter
 * (Module 6, occupancyService.js) — this card was built ahead of that
 * module shipping and needed no further changes on this side once it did.
 */
export async function getDashboardStats() {
  const range = { $gte: startOfToday(), $lte: endOfToday() };

  const [currentOccupancy, activeCounters, staffOnline, tokensIssued] = await Promise.all([
    getCurrentOccupancy(),
    Counter.countDocuments({ isActive: true, status: { $in: ["active", "paused"] } }),
    Counter.countDocuments({ isActive: true, staffOnDuty: { $ne: null } }),
    Token.countDocuments({ createdAt: range }),
  ]);

  return {
    currentOccupancy,
    activeCounters,
    tokensIssued,
    staffOnline,
  };
}

/**
 * Full per-counter + totals breakdown for today. Shared by the Reports
 * tab (on-screen preview) and the PDF/Excel export, so both always agree.
 */
export async function getTodayReportData() {
  const counters = await Counter.find({}).sort({ counterNumber: 1 }).lean();

  const perCounter = await Promise.all(
    counters.map(async (c) => ({
      counterNumber: c.counterNumber,
      name: c.name,
      status: c.status,
      ...(await getTodayStatsForCounter(c._id)),
    }))
  );

  const totals = perCounter.reduce(
    (acc, c) => ({
      tokensIssued: acc.tokensIssued + c.todayCustomers,
      completed: acc.completed + c.completed,
      skipped: acc.skipped + c.skipped,
      waitingCount: acc.waitingCount + c.waitingCount,
    }),
    { tokensIssued: 0, completed: 0, skipped: 0, waitingCount: 0 }
  );

  const staffOnline = await Counter.countDocuments({ isActive: true, staffOnDuty: { $ne: null } });
  const activeCounters = counters.filter((c) => c.status !== "offline").length;

  return {
    generatedAt: new Date(),
    date: startOfToday(),
    totals: { ...totals, staffOnline, activeCounters },
    counters: perCounter,
  };
}

/**
 * Reset Today's Queue — the single Queue Management action the Admin
 * Dashboard exposes. Cancels every token created today that's still
 * waiting/serving, and clears every counter's currentToken, without
 * touching staff/counter/service configuration or prior days' history.
 *
 * Uses the "cancelled" status (see Token.js) so reports can distinguish
 * an admin-initiated reset from an individual no-show a staff member
 * skipped mid-shift.
 */
export async function resetTodayQueue(adminId) {
  const range = { $gte: startOfToday(), $lte: endOfToday() };

  const affected = await Token.find({
    createdAt: range,
    status: { $in: ["waiting", "serving"] },
  }).select("_id");

  const ids = affected.map((t) => t._id);

  if (ids.length > 0) {
    await Token.updateMany(
      { _id: { $in: ids } },
      {
        $set: { status: "cancelled" },
        $push: { statusHistory: { status: "cancelled", by: adminId, at: new Date() } },
      }
    );
  }

  await Counter.updateMany({ currentToken: { $ne: null } }, { currentToken: null });

  return { tokensCancelled: ids.length };
}
