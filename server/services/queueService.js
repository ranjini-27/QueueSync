import Token from "../models/Token.js";
import Counter from "../models/Counter.js";

/** Start (00:00:00) of "today" in server-local time. */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End (23:59:59.999) of "today" in server-local time. */
export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Builds the next token number for a counter, e.g. "A021".
 * Sequence resets daily per counter: it's a count of tokens already
 * created for this counter today, zero-padded to 3 digits.
 */
export async function nextTokenNumber(counter) {
  const countToday = await Token.countDocuments({
    counter: counter._id,
    createdAt: { $gte: startOfToday(), $lte: endOfToday() },
  });
  const sequence = String(countToday + 1).padStart(3, "0");
  return `${counter.tokenPrefix}${sequence}`;
}

/**
 * Waiting-time algorithm from the spec:
 *   Estimated waiting time = average service time per customer x
 *                             number of customers ahead
 * Returns whole minutes, minimum 1 while anyone is ahead.
 */
export function estimateWaitMinutes(avgServiceTimeSeconds, customersAhead) {
  if (customersAhead <= 0) return 0;
  const minutes = Math.round((avgServiceTimeSeconds * customersAhead) / 60);
  return Math.max(1, minutes);
}

/**
 * Rolls a newly observed service duration into the counter's rolling
 * average using an exponential moving average (30% weight on the latest
 * sample), so the estimate keeps adapting to real conditions without being
 * thrown off by a single unusually fast/slow customer.
 */
export function nextRollingAverage(currentAvgSeconds, latestDurationSeconds) {
  const clamped = Math.min(Math.max(latestDurationSeconds, 30), 3600); // 30s..60min sanity bounds
  return Math.round(currentAvgSeconds * 0.7 + clamped * 0.3);
}

/**
 * Recomputes estimatedWaitMinutes for every waiting token on a counter,
 * based on its position in the FIFO queue. Called after any action that
 * changes queue order (call next, skip, transfer in/out).
 */
export async function refreshQueueEstimates(counter) {
  const waiting = await Token.find({ counter: counter._id, status: "waiting" }).sort({
    createdAt: 1,
  });

  await Promise.all(
    waiting.map((token, index) =>
      Token.updateOne(
        { _id: token._id },
        { estimatedWaitMinutes: estimateWaitMinutes(counter.avgServiceTimeSeconds, index + 1) }
      )
    )
  );

  return waiting.length;
}

/** Number of customers currently waiting ahead of (not including) a given token. */
export async function countCustomersAhead(counter, token) {
  return Token.countDocuments({
    counter: counter._id,
    status: "waiting",
    createdAt: { $lt: token.createdAt },
  });
}

/**
 * Today's per-counter stats for the Staff Dashboard header cards:
 * total customers seen, completed, skipped, and average wait (minutes)
 * for customers currently still waiting.
 */
export async function getTodayStatsForCounter(counterId) {
  const range = { $gte: startOfToday(), $lte: endOfToday() };

  const [todayCustomers, completed, skipped, waitingAgg] = await Promise.all([
    Token.countDocuments({ counter: counterId, createdAt: range }),
    Token.countDocuments({ counter: counterId, status: "completed", createdAt: range }),
    Token.countDocuments({ counter: counterId, status: "skipped", createdAt: range }),
    Token.aggregate([
      { $match: { counter: counterId, status: "waiting" } },
      { $group: { _id: null, avgWait: { $avg: "$estimatedWaitMinutes" }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    todayCustomers,
    completed,
    skipped,
    waitingCount: waitingAgg[0]?.count || 0,
    averageWaitMinutes: waitingAgg[0] ? Math.round(waitingAgg[0].avgWait) : 0,
  };
}

/**
 * Full state snapshot for one counter: used by the Staff Dashboard, and
 * reusable as-is by the Centralized Queue Display (TV page) and Customer
 * Portal once those modules are built, so all three surfaces render from
 * one consistent shape.
 */
export async function buildCounterSnapshot(counterId) {
  const counter = await Counter.findById(counterId).populate("currentToken").lean();
  if (!counter) return null;

  const queue = await Token.find({ counter: counterId, status: "waiting" })
    .sort({ createdAt: 1 })
    .populate("customer", "fullName")
    .lean();

  const stats = await getTodayStatsForCounter(counterId);

  return {
    counter: {
      _id: counter._id,
      name: counter.name,
      counterNumber: counter.counterNumber,
      tokenPrefix: counter.tokenPrefix,
      status: counter.status,
      servicesOffered: counter.servicesOffered,
      avgServiceTimeSeconds: counter.avgServiceTimeSeconds,
    },
    currentToken: counter.currentToken || null,
    queue,
    queueCount: queue.length,
    stats,
  };
}

/** Snapshot for every counter — feeds the TV Display and staff/customer views. */
export async function buildAllCountersSnapshot() {
  const counters = await Counter.find({ isActive: true }).sort({ counterNumber: 1 }).lean();
  return Promise.all(counters.map((c) => buildCounterSnapshot(c._id)));
}
