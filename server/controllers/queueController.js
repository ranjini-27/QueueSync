import Counter from "../models/Counter.js";
import Token from "../models/Token.js";
import Service from "../models/Service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import {
  nextTokenNumber,
  refreshQueueEstimates,
  buildAllCountersSnapshot,
  buildCounterSnapshot,
} from "../services/queueService.js";
import { getOccupancySnapshot } from "../services/occupancyService.js";
import { emit, SOCKET_EVENTS } from "../socket/events.js";

/**
 * POST /api/queue/tokens — generate a new token for a service.
 *
 * Deliberately unauthenticated: the Smart Token Kiosk (Module 5) issues
 * tokens to walk-in customers with no login at all, per spec ("No QR Code.
 * No Mobile Scanning."). If a valid customer Bearer token IS supplied
 * (Customer Portal use), `protect`-style decoding happens softly here so
 * the token can still be linked to that customer's account — but a
 * missing/invalid token never blocks kiosk-style issuance.
 *
 * This endpoint is what Staff Dashboard testing uses today to put tokens
 * into a counter's queue ahead of the Customer Portal / Kiosk UI shipping.
 */
export async function generateToken(req, res) {
  try {
    const { service, counterNumber, customerId } = req.body;

    if (!service) return sendError(res, 422, "A service must be selected.");

    let counter;
    if (counterNumber) {
      counter = await Counter.findOne({ counterNumber, isActive: true });
      if (!counter) return sendError(res, 404, "That counter does not exist.");
      if (!counter.servicesOffered.includes(service)) {
        return sendError(res, 422, `Counter ${counter.counterNumber} does not offer "${service}".`);
      }
    } else {
      // Auto-route to the least busy active/paused counter offering this service.
      const candidates = await Counter.find({
        isActive: true,
        status: { $in: ["active", "paused"] },
        servicesOffered: service,
      });
      if (candidates.length === 0) {
        return sendError(res, 503, "No counter is currently offering this service. Please try again shortly.");
      }
      const queueCounts = await Promise.all(
        candidates.map((c) => Token.countDocuments({ counter: c._id, status: "waiting" }))
      );
      counter = candidates[queueCounts.indexOf(Math.min(...queueCounts))];
    }

    const tokenNumber = await nextTokenNumber(counter);
    const token = await Token.create({
      tokenNumber,
      service,
      counter: counter._id,
      customer: customerId || null,
      statusHistory: [{ status: "waiting" }],
    });

    const waitingCount = await refreshQueueEstimates(counter);
    const saved = await Token.findById(token._id);

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.TOKEN_GENERATED, { token: saved, counterId: counter._id });
    emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { counterId: counter._id, waitingCount });

    return sendSuccess(
      res,
      201,
      { token: saved, counter: { name: counter.name, counterNumber: counter.counterNumber } },
      "Token generated."
    );
  } catch (err) {
    return sendError(res, 500, "Could not generate a token.", err.message);
  }
}

/**
 * GET /api/queue/services — public list of active services only.
 *
 * Powers the Smart Kiosk's (Module 5) service-selection screen. Deliberately
 * separate from GET /api/admin/services (admin-only, returns every service
 * including inactive ones for management): keeping the kiosk on its own
 * read-only, always-active-only endpoint means a disabled service can never
 * leak onto the kiosk through a missed query-string filter.
 */
export async function getActiveServices(_req, res) {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(res, 200, { services });
  } catch (err) {
    return sendError(res, 500, "Could not load services.", err.message);
  }
}

/** GET /api/queue/counters — public snapshot of every counter (feeds the TV display & customer dashboard). */
export async function getAllCounterStatus(_req, res) {
  try {
    const snapshots = await buildAllCountersSnapshot();
    return sendSuccess(res, 200, { counters: snapshots });
  } catch (err) {
    return sendError(res, 500, "Could not load counter status.", err.message);
  }
}

/**
 * GET /api/queue/dashboard — public branch overview: occupancy plus every
 * active counter's current token, customers waiting, and estimated wait.
 *
 * Deliberately unauthenticated (no customer login/registration required):
 * it powers the "Customer Dashboard" surfaced from the site's More Options
 * menu, reusing the exact same occupancy + counter-snapshot building
 * blocks as the Staff Dashboard and Central Display so every surface in
 * the app stays consistent with a single source of truth.
 */
export async function getPublicDashboard(_req, res) {
  try {
    const [occupancy, counterSnapshots] = await Promise.all([
      getOccupancySnapshot(),
      buildAllCountersSnapshot(),
    ]);

    const counters = counterSnapshots.filter(Boolean);

    return sendSuccess(res, 200, {
      occupancy,
      activeCounters: counters.filter((c) => c.counter.status === "active").length,
      counters,
    });
  } catch (err) {
    return sendError(res, 500, "Could not load the branch dashboard.", err.message);
  }
}

/** GET /api/queue/counters/:counterNumber — single counter snapshot. */
export async function getCounterStatus(req, res) {
  try {
    const counter = await Counter.findOne({ counterNumber: req.params.counterNumber });
    if (!counter) return sendError(res, 404, "Counter not found.");
    const snapshot = await buildCounterSnapshot(counter._id);
    return sendSuccess(res, 200, { ...snapshot });
  } catch (err) {
    return sendError(res, 500, "Could not load counter status.", err.message);
  }
}

/** GET /api/queue/tokens/:tokenNumber/status — a customer polling/looking up their own token. */
export async function getTokenStatus(req, res) {
  try {
    const token = await Token.findOne({ tokenNumber: req.params.tokenNumber.toUpperCase() })
      .sort({ createdAt: -1 })
      .populate("counter", "name counterNumber status");
    if (!token) return sendError(res, 404, "Token not found.");
    return sendSuccess(res, 200, { token });
  } catch (err) {
    return sendError(res, 500, "Could not look up that token.", err.message);
  }
}
