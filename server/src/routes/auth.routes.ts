// FILE: server/src/routes/auth.routes.ts
import { Router } from "express";
import { getMeHandler, postLogin, postRegister, postLogout, postRefresh } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";


const router = Router();

// Phase 3 endpoints
router.post("/login", postLogin);
router.post("/register", postRegister);
router.post("/refresh", postRefresh);
router.post("/logout", postLogout);
router.get("/me", requireAuth, getMeHandler);

export default router;