import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
  getDashboard,
  callNext,
  callSpecific,
  recall,
  skip,
  pauseCounter,
  resumeCounter,
  transferCustomer,
} from "../controllers/staffController.js";

const router = Router();

// Every route below requires a valid, approved staff session.
router.use(protect, requireRole("staff"));

router.get("/dashboard", getDashboard);

router.post("/queue/call-next", callNext);
router.post("/queue/call-specific", callSpecific);
router.post("/queue/recall", recall);
router.post("/queue/skip", skip);
router.post("/queue/pause", pauseCounter);
router.post("/queue/resume", resumeCounter);
router.post("/queue/transfer", transferCustomer);

export default router;
