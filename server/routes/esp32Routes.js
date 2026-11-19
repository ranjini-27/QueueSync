import { Router } from "express";
import {
  reportOccupancy,
  getDisplayData,
} from "../controllers/esp32Controller.js";
import { verifyDeviceKey } from "../middleware/authMiddleware.js";
import { validate, occupancyEventRules } from "../middleware/validators.js";

const router = Router();

// Device-authenticated: only the ESP32 unit (holding ESP32_DEVICE_KEY) may
// post occupancy events — see verifyDeviceKey in authMiddleware.js.
router.post("/occupancy", verifyDeviceKey, occupancyEventRules, validate, reportOccupancy);
router.get("/display", verifyDeviceKey, getDisplayData);

export default router;
