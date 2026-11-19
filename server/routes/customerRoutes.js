import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { getDashboard } from "../controllers/customerController.js";

const router = Router();

// Every route below requires a valid, logged-in customer session.
router.use(protect, requireRole("customer"));

router.get("/dashboard", getDashboard);

export default router;
