import Counter from "../models/Counter.js";
import Token from "../models/Token.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { getOccupancySnapshot } from "../services/occupancyService.js";
import {
  refreshQueueEstimates,
  nextRollingAverage,
  buildCounterSnapshot,
} from "../services/queueService.js";
import { emit, SOCKET_EVENTS } from "../socket/events.js";

/**
 * Resolves the Counter document a logged-in staff member controls, and
 * "claims" it on their behalf if it's currently unstaffed. If another
 * staff member already holds it, this fails loudly rather than silently
 * handing over control mid-shift — an admin reassignment flow (Module 4)
 * is the intended way to resolve that.
 */
async function resolveAndClaimCounter(staff) {
  const counter = await Counter.findOne({ name: staff.counterAssigned, isActive: true });
  if (!counter) {
    const err = new Error(
      `No counter named "${staff.counterAssigned}" has been provisioned yet. Ask an admin to set it up.`
    );
    err.status = 404;
    throw err;
  }

  if (counter.staffOnDuty && String(counter.staffOnDuty) !== String(staff._id)) {
    const err = new Error(`${counter.name} is already staffed by another team member.`);
    err.status = 409;
    throw err;
  }

  if (!counter.staffOnDuty) {
    counter.staffOnDuty = staff._id;
    counter.status = "active";
    await counter.save();
  }

  return counter;
}

/** GET /api/staff/dashboard — full snapshot for the logged-in staff member's counter. */
export async function getDashboard(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);
    const snapshot = await buildCounterSnapshot(counter._id);

    const occupancy = await getOccupancySnapshot();

    snapshot.stats = {
      ...snapshot.stats,
      occupancy: occupancy.current,
    };

    return sendSuccess(res, 200, { ...snapshot });
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not load dashboard.");
  }
}

/** POST /api/staff/queue/call-next — complete the current token (if any) and call the next waiting one. */
export async function callNext(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);

    if (counter.status === "paused") {
      return sendError(res, 409, "Resume the counter before calling the next token.");
    }

    // Complete whoever is currently being served, and fold their service
    // duration into the counter's rolling average.
    if (counter.currentToken) {
      const current = await Token.findById(counter.currentToken);
      if (current && current.status === "serving") {
        current.status = "completed";
        current.completedAt = new Date();
        current.statusHistory.push({ status: "completed", by: req.user._id });
        await current.save();

        if (current.servingStartedAt) {
          const durationSeconds = (current.completedAt - current.servingStartedAt) / 1000;
          counter.avgServiceTimeSeconds = nextRollingAverage(
            counter.avgServiceTimeSeconds,
            durationSeconds
          );
        }
      }
    }

    const next = await Token.findOne({ counter: counter._id, status: "waiting" }).sort({
      createdAt: 1,
    });

    if (!next) {
      counter.currentToken = null;
      await counter.save();
      const io = req.app.get("io");
      emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { counterId: counter._id, waitingCount: 0 });
      emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });
      return sendSuccess(res, 200, { ...(await buildCounterSnapshot(counter._id)) }, "Queue is empty.");
    }

    next.status = "serving";
    next.calledAt = new Date();
    next.servingStartedAt = new Date();
    next.servedBy = req.user._id;
    next.statusHistory.push({ status: "serving", by: req.user._id });
    await next.save();

    counter.currentToken = next._id;
    await counter.save();
    const waitingCount = await refreshQueueEstimates(counter);

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.TOKEN_CALLED, {
      counterId: counter._id,
      counterName: counter.name,
      token: next,
    });
    if (next.customer) {
      emit(io, SOCKET_EVENTS.NOTIFICATION_SENT, {
        customerId: next.customer,
        message: `Your turn! Please proceed to ${counter.name}.`,
      });
    }
    emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { counterId: counter._id, waitingCount });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { ...(await buildCounterSnapshot(counter._id)) }, "Next token called.");
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not call the next token.");
  }
}

/** POST /api/staff/queue/call-specific — manual override (Ctrl+N) to call a specific waiting token out of order. */
export async function callSpecific(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);
    const { tokenId } = req.body;
    if (!tokenId) return sendError(res, 422, "tokenId is required.");

    if (counter.status === "paused") {
      return sendError(res, 409, "Resume the counter before calling a token.");
    }

    const target = await Token.findOne({ _id: tokenId, counter: counter._id, status: "waiting" });
    if (!target) return sendError(res, 404, "That token is not waiting on your counter.");

    if (counter.currentToken) {
      const current = await Token.findById(counter.currentToken);
      if (current && current.status === "serving") {
        current.status = "completed";
        current.completedAt = new Date();
        current.statusHistory.push({ status: "completed", by: req.user._id });
        await current.save();
        if (current.servingStartedAt) {
          const durationSeconds = (current.completedAt - current.servingStartedAt) / 1000;
          counter.avgServiceTimeSeconds = nextRollingAverage(
            counter.avgServiceTimeSeconds,
            durationSeconds
          );
        }
      }
    }

    target.status = "serving";
    target.calledAt = new Date();
    target.servingStartedAt = new Date();
    target.servedBy = req.user._id;
    target.statusHistory.push({ status: "serving", by: req.user._id });
    await target.save();

    counter.currentToken = target._id;
    await counter.save();
    const waitingCount = await refreshQueueEstimates(counter);

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.TOKEN_CALLED, { counterId: counter._id, counterName: counter.name, token: target });
    emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { counterId: counter._id, waitingCount });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { ...(await buildCounterSnapshot(counter._id)) }, "Token called manually.");
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not call that token.");
  }
}

/** POST /api/staff/queue/recall — re-announce the token currently being served, without changing the queue. */
export async function recall(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);
    if (!counter.currentToken) {
      return sendError(res, 409, "No token is currently being served on your counter.");
    }
    const current = await Token.findById(counter.currentToken);

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.TOKEN_CALLED, {
      counterId: counter._id,
      counterName: counter.name,
      token: current,
      recalled: true,
    });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { token: current }, "Token recalled.");
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not recall the token.");
  }
}

/** POST /api/staff/queue/skip — mark the currently-served token as a no-show and clear the counter. */
export async function skip(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);
    if (!counter.currentToken) {
      return sendError(res, 409, "No token is currently being served on your counter.");
    }

    const current = await Token.findById(counter.currentToken);
    current.status = "skipped";
    current.skippedAt = new Date();
    current.statusHistory.push({ status: "skipped", by: req.user._id });
    await current.save();

    counter.currentToken = null;
    await counter.save();

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.TOKEN_SKIPPED, { counterId: counter._id, counterName: counter.name, token: current });
    emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { counterId: counter._id });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { ...(await buildCounterSnapshot(counter._id)) }, "Token skipped.");
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not skip the token.");
  }
}

/** POST /api/staff/queue/pause — stop accepting new CALL NEXT actions on this counter. */
export async function pauseCounter(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);
    counter.status = "paused";
    await counter.save();

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.COUNTER_PAUSED, { counterId: counter._id, counterName: counter.name });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { counter }, "Counter paused.");
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not pause the counter.");
  }
}

/** POST /api/staff/queue/resume */
export async function resumeCounter(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);
    counter.status = "active";
    await counter.save();

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.COUNTER_RESUMED, { counterId: counter._id, counterName: counter.name });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { counter }, "Counter resumed.");
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not resume the counter.");
  }
}

/** POST /api/staff/queue/transfer — move a token (waiting or currently serving) to another counter's queue. */
export async function transferCustomer(req, res) {
  try {
    const counter = await resolveAndClaimCounter(req.user);
    const { tokenId, targetCounterNumber } = req.body;
    if (!tokenId || !targetCounterNumber) {
      return sendError(res, 422, "tokenId and targetCounterNumber are required.");
    }

    const targetCounter = await Counter.findOne({ counterNumber: targetCounterNumber, isActive: true });
    if (!targetCounter) return sendError(res, 404, "Target counter not found.");
    if (String(targetCounter._id) === String(counter._id)) {
      return sendError(res, 422, "Choose a different counter to transfer to.");
    }

    const token = await Token.findOne({
      _id: tokenId,
      counter: counter._id,
      status: { $in: ["waiting", "serving"] },
    });
    if (!token) return sendError(res, 404, "That token is not active on your counter.");

    const wasServing = token.status === "serving";

    token.transferHistory.push({ fromCounter: counter._id, toCounter: targetCounter._id, by: req.user._id });
    token.counter = targetCounter._id;
    token.status = "waiting";
    token.servedBy = null;
    token.calledAt = null;
    token.servingStartedAt = null;
    token.statusHistory.push({ status: "transferred", by: req.user._id });
    await token.save();

    if (wasServing) {
      counter.currentToken = null;
      await counter.save();
    }

    await Promise.all([refreshQueueEstimates(counter), refreshQueueEstimates(targetCounter)]);

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { counterId: counter._id });
    emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { counterId: targetCounter._id });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: targetCounter._id });

    return sendSuccess(
      res,
      200,
      { ...(await buildCounterSnapshot(counter._id)) },
      `Transferred to ${targetCounter.name}.`
    );
  } catch (err) {
    return sendError(res, err.status || 500, err.message || "Could not transfer the customer.");
  }
}
