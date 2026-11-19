import mongoose from "mongoose";

/**
 * Opens the MongoDB connection. Called once at server boot.
 * Exits the process on failure so orchestrators (pm2, docker) can restart cleanly.
 */
export default async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not set in the environment");

    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
