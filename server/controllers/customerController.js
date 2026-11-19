import Token from "../models/Token.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { getOccupancySnapshot } from "../services/occupancyService.js";
import { buildAllCountersSnapshot, countCustomersAhead } from "../services/queueService.js";

/**
 * GET /api/customer/dashboard
 *
 * Single combined snapshot for the Customer Dashboard, so the initial page
 * load — and every Socket.IO-triggered refresh — is one round trip instead
 * of five. Reuses the same building blocks the Staff Dashboard, Kiosk, and
 * Central Display already read from (occupancyService, queueService) so
 * every surface in the app stays consistent with a single source of truth.
 */
export async function getDashboard(req, res) {
  try {
    const customerId = req.user._id;

    const [occupancy, counterSnapshots, myToken, recentVisits] = await Promise.all([
      getOccupancySnapshot(),
      buildAllCountersSnapshot(),
      Token.findOne({ customer: customerId, status: { $in: ["waiting", "serving"] } })
        .sort({ createdAt: -1 })
        .populate("counter", "name counterNumber status"),
      Token.find({ customer: customerId, status: { $in: ["completed", "skipped", "cancelled"] } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("counter", "name counterNumber"),
    ]);

    const validCounterSnapshots = counterSnapshots.filter(Boolean);

    // "Now serving" bank-wide (Section 3): whichever counter most recently
    // called a token — i.e. the highest currentToken.calledAt across every
    // counter currently serving someone.
    const currentlyServing = validCounterSnapshots
      .filter((s) => s.currentToken && s.currentToken.calledAt)
      .sort((a, b) => new Date(b.currentToken.calledAt) - new Date(a.currentToken.calledAt));
    const nowServing = currentlyServing[0]
      ? { token: currentlyServing[0].currentToken, counter: currentlyServing[0].counter }
      : null;

    // This customer's own token (Section 4 / 6): only computed when
    // they're still waiting — a token already being served has no one
    // "ahead" of it anymore.
    let myTokenPayload = null;
    if (myToken) {
      const customersAhead =
        myToken.status === "waiting" ? await countCustomersAhead(myToken.counter, myToken) : 0;
      myTokenPayload = {
        token: myToken,
        counter: myToken.counter,
        customersAhead,
        estimatedWaitMinutes: myToken.estimatedWaitMinutes,
      };
    }

    return sendSuccess(res, 200, {
      occupancy,
      nowServing,
      myToken: myTokenPayload,
      counters: validCounterSnapshots,
      recentVisits,
    });
  } catch (err) {
    return sendError(res, 500, "Could not load your dashboard.", err.message);
  }
}
