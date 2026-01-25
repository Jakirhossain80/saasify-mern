// FILE: server/src/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { getCorsOptions } from "./config/cors";
import authRoutes from "./routes/auth.routes";
import tenantRoutes from "./routes/tenant.routes";
import platformRoutes from "./routes/platform.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors(getCorsOptions()));

// ✅ FIX: Do NOT use "*" here. Use regex for preflight.
app.options(/.*/, cors(getCorsOptions()));

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Phase 3
app.use("/api/auth", authRoutes);

// Phase 5 platform routes
app.use("/api", platformRoutes);

// Phase 4/5 tenant routes
app.use("/api", tenantRoutes);

// last
app.use(errorHandler);

export default app;
