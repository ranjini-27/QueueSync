// Canonical Socket.IO event names from the project spec. Keeping them as
// constants avoids typo drift between the modules that emit (staff/kiosk/
// customer controllers) and the ones that listen (client dashboards, the
// TV display, the ESP32 unit's WiFi client).
export const SOCKET_EVENTS = {
  CUSTOMER_JOINED: "customerJoined",
  TOKEN_GENERATED: "tokenGenerated",
  TOKEN_CALLED: "tokenCalled",
  TOKEN_SKIPPED: "tokenSkipped",
  COUNTER_PAUSED: "counterPaused",
  COUNTER_RESUMED: "counterResumed",
  OCCUPANCY_UPDATED: "occupancyUpdated",
  QUEUE_UPDATED: "queueUpdated",
  DISPLAY_UPDATED: "displayUpdated",
  NOTIFICATION_SENT: "notificationSent",
};

/**
 * Broadcasts an event to every connected client (customer apps, staff
 * dashboards, the TV display page, and — via its WiFi client — the ESP32
 * unit). The system is small enough (single branch) that a global
 * broadcast is simpler and cheap; if multi-branch support is added later,
 * this is the place to switch to Socket.IO rooms per branch.
 */
export function emit(io, event, payload) {
  if (!io) return; // defensive: some unit-test contexts run without a socket server
  io.emit(event, { event, at: new Date().toISOString(), ...payload });
}
