/**
 * Sends a consistent JSON error shape across all controllers.
 * { success: false, message, errors? }
 */
export function sendError(res, status, message, errors = undefined) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

export function sendSuccess(res, status, data = {}, message = undefined) {
  return res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    ...data,
  });
}
