// FILE: server/src/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

/**
 * ✅ CORS (local dev)
 * - origin must be EXACT (no trailing slash)
 * - credentials true so cookies can be saved/sent
 */
app.use(
  cors({
    origin: env.CLIENT_ORIGIN, // "http://localhost:5173"
    credentials: true,
  })
);

// ✅ parsers
app.use(express.json());
app.use(cookieParser());

// ✅ health
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ✅ Auth (Phase 3)
app.use("/api/auth", authRoutes);

// ✅ Error handler last
app.use(errorHandler);

export default app;
