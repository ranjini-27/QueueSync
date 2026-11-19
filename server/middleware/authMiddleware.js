import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse.js";
import Customer from "../models/Customer.js";
import Staff from "../models/Staff.js";
import Admin from "../models/Admin.js";

const MODEL_BY_ROLE = { customer: Customer, staff: Staff, admin: Admin };

/**
 * Verifies the Bearer token, loads the account, and attaches it to req.user
 * along with req.role. Downstream route handlers rely on both.
 */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return sendError(res, 401, "Authentication required. Please log in.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = MODEL_BY_ROLE[decoded.role];
    if (!Model) return sendError(res, 401, "Invalid token role.");

    const account = await Model.findById(decoded.id);
    if (!account) return sendError(res, 401, "Account no longer exists.");
    if (account.isActive === false) {
      return sendError(res, 403, "This account has been deactivated.");
    }
    if (decoded.role === "staff" && account.approvalStatus !== "approved") {
      return sendError(res, 403, "Your staff account is pending admin approval.");
    }

    req.user = account;
    req.role = decoded.role;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, 401, "Session expired. Please log in again.");
    }
    return sendError(res, 401, "Invalid or malformed token.");
  }
}

/**
 * Restricts a route to one or more roles. Use after `protect`.
 * Example: router.post("/approve", protect, requireRole("admin"), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return sendError(res, 403, "You do not have permission to perform this action.");
    }
    next();
  };
}

/**
 * Lightweight shared-secret auth for the ESP32 Occupancy Unit (Module 6).
 * The device can't run a JWT login flow, so it authenticates with a single
 * static key baked into its firmware (sent as the `x-device-key` header)
 * instead — just enough to stop other devices on the branch WiFi from
 * posting fake occupancy events, without standing up a full account/model
 * for a piece of hardware.
 */
export function verifyDeviceKey(req, res, next) {
  const key = req.headers["x-device-key"];
  if (!process.env.ESP32_DEVICE_KEY || key !== process.env.ESP32_DEVICE_KEY) {
    return sendError(res, 401, "Invalid or missing device key.");
  }
  next();
}
