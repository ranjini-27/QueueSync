import jwt from "jsonwebtoken";

/**
 * Issues a signed JWT carrying the account id and role.
 * role is one of "customer" | "staff" | "admin" and drives
 * role-based access control in authMiddleware.
 */
export function generateToken({ id, role }) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}
