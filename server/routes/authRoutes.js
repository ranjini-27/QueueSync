import { Router } from "express";
import {
  registerCustomer,
  loginCustomer,
  registerStaff,
  loginStaff,
  loginAdmin,
  getMe,
} from "../controllers/authController.js";
import {
  validate,
  customerRegisterRules,
  customerLoginRules,
  staffRegisterRules,
  staffLoginRules,
  adminLoginRules,
} from "../middleware/validators.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/customer/register", customerRegisterRules, validate, registerCustomer);
router.post("/customer/login", customerLoginRules, validate, loginCustomer);

router.post("/staff/register", staffRegisterRules, validate, registerStaff);
router.post("/staff/login", staffLoginRules, validate, loginStaff);

router.post("/admin/login", adminLoginRules, validate, loginAdmin);

router.get("/me", protect, getMe);

export default router;
