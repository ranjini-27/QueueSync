import { body, validationResult } from "express-validator";
import { sendError } from "../utils/apiResponse.js";

/** Runs after a chain of express-validator rules; short-circuits with 422 on failure. */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return sendError(res, 422, "Please fix the highlighted fields.", errors);
  }
  next();
}

export const customerRegisterRules = [
  body("fullName").trim().isLength({ min: 2, max: 80 }).withMessage("Full name must be 2-80 characters."),
  body("mobileNumber").trim().matches(/^\+?[0-9]{10,15}$/).withMessage("Enter a valid mobile number."),
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
];

export const customerLoginRules = [
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

export const staffRegisterRules = [
  body("staffId").trim().notEmpty().withMessage("Staff ID is required."),
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters."),
  body("counterAssigned").trim().notEmpty().withMessage("Counter assignment is required."),
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
];

export const staffLoginRules = [
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

export const adminLoginRules = [
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

/* ------------------------- Module 4 — Admin Dashboard ------------------------- */

export const adminStaffCreateRules = [
  body("staffId").trim().notEmpty().withMessage("Staff ID is required."),
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters."),
  body("counterAssigned").trim().notEmpty().withMessage("Counter assignment is required."),
  body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
];

export const adminStaffUpdateRules = [
  body("name").optional().trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters."),
  body("email").optional().trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("counterAssigned").optional().trim().notEmpty().withMessage("Counter assignment cannot be empty."),
];

export const staffStatusRules = [
  body("isActive").isBoolean().withMessage("isActive must be true or false."),
];

export const assignCounterRules = [
  body("counterId").notEmpty().withMessage("counterId is required."),
];

export const counterCreateRules = [
  body("name").trim().notEmpty().withMessage("Counter name is required."),
  body("counterNumber").isInt({ min: 1 }).withMessage("Counter number must be a positive integer."),
  body("tokenPrefix")
    .trim()
    .isLength({ min: 1, max: 3 })
    .withMessage("Token prefix must be 1-3 characters.")
    .isAlpha()
    .withMessage("Token prefix must contain letters only."),
  body("servicesOffered").optional().isArray().withMessage("servicesOffered must be a list."),
];

export const counterUpdateRules = [
  body("name").optional().trim().notEmpty().withMessage("Counter name cannot be empty."),
  body("servicesOffered").optional().isArray().withMessage("servicesOffered must be a list."),
];

export const counterToggleRules = [
  body("isActive").isBoolean().withMessage("isActive must be true or false."),
];

export const serviceCreateRules = [
  body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Service name must be 2-60 characters."),
  body("description").optional().trim().isLength({ max: 200 }).withMessage("Description is too long."),
];

export const serviceUpdateRules = [
  body("name").optional().trim().isLength({ min: 2, max: 60 }).withMessage("Service name must be 2-60 characters."),
  body("description").optional().trim().isLength({ max: 200 }).withMessage("Description is too long."),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false."),
];

export const occupancyEventRules = [
  body("direction").isIn(["entry", "exit"]).withMessage('direction must be "entry" or "exit".'),
];
