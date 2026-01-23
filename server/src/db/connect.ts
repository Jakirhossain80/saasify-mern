// FILE: server/src/db/connect.ts
import mongoose from "mongoose";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  // If mongoose already has a live connection (hot reload / nodemon), reuse it
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const uri = requireEnv("MONGODB_URI");

  try {
    await mongoose.connect(uri, {
      // Good defaults for local dev + Atlas
      autoIndex: true,
    });

    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ MongoDB connection failed:", message);
    process.exit(1);
  }
}
