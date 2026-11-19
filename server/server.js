import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import esp32Routes from "./routes/esp32Routes.js";
import { sendError } from "./utils/apiResponse.js";

await connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/esp32", esp32Routes);
// The Kiosk (Module 5) and Central Queue Display (Module 6) are pure
// frontend pages — they read from /api/queue above, so no dedicated route
// file was needed for either.

// 404 handler
app.use((req, res) => sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`));

// Central error handler (catches anything thrown/next(err) from controllers)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[server] Unhandled error:", err);
  sendError(res, 500, "Something went wrong on our end.");
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_URL || "*" },
});

// Event names live in server/socket/events.js. Controllers emit directly
// via req.app.get("io") rather than routing through this handler — this
// listener only needs to track connect/disconnect for now. A dedicated
// namespace/room per branch can be added here if multi-branch support
// is ever needed.
io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`[socket] client disconnected: ${socket.id}`));
});

app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
