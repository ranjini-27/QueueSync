import { Router } from "express";
import {
  generateToken,
  getAllCounterStatus,
  getCounterStatus,
  getTokenStatus,
  getActiveServices,
  getPublicDashboard,
} from "../controllers/queueController.js";

const router = Router();

// Intentionally public — the Smart Kiosk (Module 5) issues tokens with no
// login, and the TV Display / Customer Dashboard must be viewable by
// anyone, no account required.
router.get("/services", getActiveServices);
router.post("/tokens", generateToken);
router.get("/tokens/:tokenNumber/status", getTokenStatus);
router.get("/counters", getAllCounterStatus);
router.get("/counters/:counterNumber", getCounterStatus);
router.get("/dashboard", getPublicDashboard);

export default router;
