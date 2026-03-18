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
app.options("*", cors(getCorsOptions()));

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Platform routes
app.use("/api", platformRoutes);

// Tenant routes
app.use("/api", tenantRoutes);

// Last
app.use(errorHandler);

export default app;
