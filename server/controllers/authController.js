import bcrypt from "bcrypt";
import Customer from "../models/Customer.js";
import Staff from "../models/Staff.js";
import Admin from "../models/Admin.js";
import { generateToken } from "../utils/generateToken.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

/* ------------------------------- Customer -------------------------------- */

export async function registerCustomer(req, res) {
  try {
    const { fullName, mobileNumber, email, password } = req.body;

    const existing = await Customer.findOne({ $or: [{ email }, { mobileNumber }] });
    if (existing) {
      return sendError(res, 409, "An account with this email or mobile number already exists.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const customer = await Customer.create({ fullName, mobileNumber, email, passwordHash });

    const token = generateToken({ id: customer._id, role: "customer" });
    return sendSuccess(res, 201, { token, user: customer, role: "customer" }, "Account created.");
  } catch (err) {
    return sendError(res, 500, "Could not create account.", err.message);
  }
}

export async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email }).select("+passwordHash");
    if (!customer) return sendError(res, 401, "Invalid email or password.");

    const match = await bcrypt.compare(password, customer.passwordHash);
    if (!match) return sendError(res, 401, "Invalid email or password.");

    if (!customer.isActive) return sendError(res, 403, "This account has been deactivated.");

    const token = generateToken({ id: customer._id, role: "customer" });
    return sendSuccess(res, 200, { token, user: customer, role: "customer" }, "Logged in.");
  } catch (err) {
    return sendError(res, 500, "Login failed.", err.message);
  }
}

/* --------------------------------- Staff ---------------------------------- */

export async function registerStaff(req, res) {
  try {
    const { staffId, name, counterAssigned, email, password } = req.body;

    const existing = await Staff.findOne({ $or: [{ email }, { staffId }] });
    if (existing) {
      return sendError(res, 409, "A staff account with this ID or email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const staff = await Staff.create({
      staffId,
      name,
      counterAssigned,
      email,
      passwordHash,
      approvalStatus: "pending",
    });

    // No token issued at registration — staff must be approved by an
    // admin (visible in the Admin Dashboard pending list) before login works.
    return sendSuccess(
      res,
      201,
      { user: staff },
      "Registration received. An admin will review and approve your account before you can log in."
    );
  } catch (err) {
    return sendError(res, 500, "Could not submit registration.", err.message);
  }
}

export async function loginStaff(req, res) {
  try {
    const { email, password } = req.body;
    const staff = await Staff.findOne({ email }).select("+passwordHash");
    if (!staff) return sendError(res, 401, "Invalid email or password.");

    const match = await bcrypt.compare(password, staff.passwordHash);
    if (!match) return sendError(res, 401, "Invalid email or password.");

    if (staff.approvalStatus === "pending") {
      return sendError(res, 403, "Your account is still pending admin approval.");
    }
    if (staff.approvalStatus === "rejected") {
      return sendError(res, 403, "Your staff registration was not approved. Contact the branch admin.");
    }
    if (!staff.isActive) return sendError(res, 403, "This account has been deactivated.");

    const token = generateToken({ id: staff._id, role: "staff" });
    return sendSuccess(res, 200, { token, user: staff, role: "staff" }, "Logged in.");
  } catch (err) {
    return sendError(res, 500, "Login failed.", err.message);
  }
}

/* --------------------------------- Admin ----------------------------------- */
// No public admin registration — accounts are provisioned via the seed script.

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select("+passwordHash");
    if (!admin) return sendError(res, 401, "Invalid email or password.");

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return sendError(res, 401, "Invalid email or password.");

    const token = generateToken({ id: admin._id, role: "admin" });
    return sendSuccess(res, 200, { token, user: admin, role: "admin" }, "Logged in.");
  } catch (err) {
    return sendError(res, 500, "Login failed.", err.message);
  }
}

/* ------------------------------- Shared -------------------------------- */

export async function getMe(req, res) {
  return sendSuccess(res, 200, { user: req.user, role: req.role });
}
