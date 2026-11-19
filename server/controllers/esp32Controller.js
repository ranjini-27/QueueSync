import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { recordOccupancyEvent, getOccupancySnapshot } from "../services/occupancyService.js";
import { emit, SOCKET_EVENTS } from "../socket/events.js";
import Counter from "../models/Counter.js";
import { buildCounterSnapshot } from "../services/queueService.js";

/**
 * POST /api/esp32/occupancy — the ESP32 Occupancy Unit posts one event per
 * detected crossing of the entry/exit IR-sensor pair.
 * body: { direction: "entry" | "exit" }
 * header: x-device-key (see verifyDeviceKey in authMiddleware.js)
 */
export async function reportOccupancy(req, res) {
  try {
    const { direction } = req.body;
    const current = await recordOccupancyEvent(direction);

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.OCCUPANCY_UPDATED, { current, direction });

    return sendSuccess(res, 200, { current }, "Occupancy updated.");
  } catch (err) {
    return sendError(res, 500, "Could not record occupancy event.", err.message);
  }
}
export async function getDisplayData(req, res) {
  try {

    const occupancy = await getOccupancySnapshot();

    const counter1 = await Counter.findOne({
      counterNumber: 1,
      isActive: true
    });

    const counter2 = await Counter.findOne({
      counterNumber: 2,
      isActive: true
    });

    const counter1Data = counter1
      ? await buildCounterSnapshot(counter1._id)
      : null;

    const counter2Data = counter2
      ? await buildCounterSnapshot(counter2._id)
      : null;

    return sendSuccess(res, 200, {

      occupancy: occupancy.current,

      counter1: {
        currentServing:
          counter1Data?.currentToken?.tokenNumber || "--",

        nextToken:
          counter1Data?.queue?.[0]?.tokenNumber || "--"
      },

      counter2: {
        currentServing:
          counter2Data?.currentToken?.tokenNumber || "--",

        nextToken:
          counter2Data?.queue?.[0]?.tokenNumber || "--"
      }

    });

  } catch (err) {

    return sendError(
      res,
      500,
      "Failed to fetch OLED data.",
      err.message
    );

  }
}
