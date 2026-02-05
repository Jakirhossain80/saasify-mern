// FILE: server/src/types/express.d.ts
import "express";
import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      // Auth (set by requireAuth)
      user?: {
        userId: string;
        email: string;
        platformRole: "user" | "platformAdmin";
      };

      // Tenant context (set by resolveTenant)
      tenantId?: Types.ObjectId;
      tenantSlug?: string;

      // Tenant role (set by requireTenantMembership)
      tenantRole?: "tenantAdmin" | "member";

      /**
       * Phase-2 passive resolver (header-based) - you still have this too
       * Filled by tenantResolve middleware
       */
      tenant: { tenantId: Types.ObjectId; slug: string } | null;
    }
  }
}

export {};
