// FILE: server/src/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { getCorsOptions } from "./config/cors";
import authRoutes from "./routes/auth.routes";
import tenantRoutes from "./routes/tenant.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth (Phase 3)
app.use("/api/auth", authRoutes);

// Tenant-scoped APIs (Phase 4)
app.use("/api", tenantRoutes);

// Error handler should be last
app.use(errorHandler);

export default app;
