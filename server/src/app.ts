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

// ✅ CORS must be BEFORE routes (and must allow credentials)
app.use(cors(getCorsOptions()));

// ✅ Preflight handling (important when sending Authorization header + cookies)
app.options("*", cors(getCorsOptions()));

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Phase 3 auth
app.use("/api/auth", authRoutes);

// Phase 5 platform routes (protected inside router)
app.use("/api", platformRoutes);

// Phase 4/5 tenant routes (protected inside router)
app.use("/api", tenantRoutes);

// Error handler last
app.use(errorHandler);

export default app;
