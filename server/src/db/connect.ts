// FILE: server/src/db/connect.ts
import mongoose from "mongoose";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function connectDB(): Promise<void> {
  const uri = requireEnv("MONGODB_URI");

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ MongoDB connection failed:", message);
    process.exit(1);
  }
}
