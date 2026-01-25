// FILE: server/src/routes/platform.routes.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePlatformAdmin } from "../middlewares/requirePlatformAdmin";
import { listAllTenantsHandler } from "../controllers/tenants.controller";



const router = Router();

// Platform admin only example
router.get("/platform/tenants", requireAuth, requirePlatformAdmin, listAllTenantsHandler);

export default router;


