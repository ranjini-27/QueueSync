import { Router } from "express";
import {
  getStats,
  listPendingStaff,
  approveStaff,
  rejectStaff,
  listStaff,
  createStaff,
  updateStaff,
  setStaffStatus,
  assignStaffCounter,
  listCounters,
  createCounter,
  updateCounter,
  toggleCounter,
  listServices,
  createService,
  updateService,
  deleteService,
  resetQueue,
} from "../controllers/adminController.js";
import { downloadTodayReport } from "../controllers/reportController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
  validate,
  adminStaffCreateRules,
  adminStaffUpdateRules,
  staffStatusRules,
  assignCounterRules,
  counterCreateRules,
  counterUpdateRules,
  counterToggleRules,
  serviceCreateRules,
  serviceUpdateRules,
} from "../middleware/validators.js";

const router = Router();

// Every route below requires a valid admin session.
router.use(protect, requireRole("admin"));

/* Dashboard */
router.get("/dashboard/stats", getStats);

/* Staff — registration approvals (existing) */
router.get("/staff/pending", listPendingStaff);
router.patch("/staff/:id/approve", approveStaff);
router.patch("/staff/:id/reject", rejectStaff);

/* Staff Management (Module 4) */
router.get("/staff", listStaff);
router.post("/staff", adminStaffCreateRules, validate, createStaff);
router.patch("/staff/:id", adminStaffUpdateRules, validate, updateStaff);
router.patch("/staff/:id/status", staffStatusRules, validate, setStaffStatus);
router.patch("/staff/:id/assign-counter", assignCounterRules, validate, assignStaffCounter);

/* Counter Management (Module 4) */
router.get("/counters", listCounters);
router.post("/counters", counterCreateRules, validate, createCounter);
router.patch("/counters/:id", counterUpdateRules, validate, updateCounter);
router.patch("/counters/:id/toggle", counterToggleRules, validate, toggleCounter);

/* Service Management (Module 4) */
router.get("/services", listServices);
router.post("/services", serviceCreateRules, validate, createService);
router.patch("/services/:id", serviceUpdateRules, validate, updateService);
router.delete("/services/:id", deleteService);

/* Queue Management (Module 4) */
router.post("/queue/reset", resetQueue);

/* Reports (Module 4) */
router.get("/reports/today", downloadTodayReport);

export default router;
