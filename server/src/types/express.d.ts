// FILE: server/src/types/express.d.ts
import "express";
import type mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      /**
       * Filled by tenantResolve middleware (Phase 2).
       * - null: no tenant header OR tenant not found
       * - object: resolved tenant identity
       */
      tenant: { tenantId: mongoose.Types.ObjectId; slug: string } | null;
    }
  }
}

export {};
