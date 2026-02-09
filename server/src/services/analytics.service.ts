// FILE: server/src/services/analytics.service.ts
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant } from "../models/Tenant";
import { Project } from "../models/Project";
import { Membership } from "../models/Membership";

/**
 * Existing type (kept for backward compatibility)
 */
export type PlatformDashboardStats = {
  totalTenants: number;
  activeTenants: number;
  totalProjects: number;
  chartData: Array<{ name: string; value: number }>;
};

/**
 * Feature #4 type (exact response shape for GET /api/platform/analytics)
 */
export type PlatformAnalyticsResponse = {
  totalTenants: number;
  activeTenants: number;
  totalProjects: number;
  chartData: Array<{ name: string; value: number }>;
};

/**
 * ✅ Existing tenant dashboard stats type (kept exactly for existing UI usage)
 * NOTE: This is used by getTenantDashboardStats() and includes chartData.
 */
export type TenantDashboardStats = {
  activeProjects: number;
  archivedProjects: number;
  membersCount: number;
  chartData: Array<{ name: string; value: number }>;
};

/**
 * ✅ NEW: Tenant analytics endpoint response type (ONLY cards)
 * GET /api/tenant/:tenantId/analytics
 */
export type TenantAnalyticsStats = {
  activeProjects: number;
  archivedProjects: number;
  membersCount: number;
};

/**
 * Helper: throw an Error with HTTP statusCode
 * (works with typical errorHandler middleware)
 */
function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

/**
 * Existing function (kept exactly, in case other parts already use it)
 * NOTE: It returns chartData as [Tenants, Active Tenants, Projects]
 */
export async function getPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  await connectDB();

  const [totalTenants, activeTenants, totalProjects] = await Promise.all([
    Tenant.countDocuments({}).exec(),
    Tenant.countDocuments({ isArchived: false }).exec(),
    // deletedAt: null matches both null and missing in MongoDB
    Project.countDocuments({ deletedAt: null }).exec(),
  ]);

  return {
    totalTenants,
    activeTenants,
    totalProjects,
    chartData: [
      { name: "Tenants", value: totalTenants },
      { name: "Active Tenants", value: activeTenants },
      { name: "Projects", value: totalProjects },
    ],
  };
}

/**
 * ✅ Feature #4 — Platform Analytics (MVP)
 * This matches the required response for:
 * GET /api/platform/analytics
 *
 * chartData choice: Tenants by status (Active vs Archived)
 */
export async function getPlatformAnalyticsService(): Promise<PlatformAnalyticsResponse> {
  await connectDB();

  const [totalTenants, activeTenants, totalProjects] = await Promise.all([
    Tenant.countDocuments({}).exec(),
    Tenant.countDocuments({ isArchived: false }).exec(),
    Project.countDocuments({ deletedAt: null }).exec(),
  ]);

  const archivedTenants = Math.max(0, totalTenants - activeTenants);

  return {
    totalTenants,
    activeTenants,
    totalProjects,
    chartData: [
      { name: "Active Tenants", value: activeTenants },
      { name: "Archived Tenants", value: archivedTenants },
    ],
  };
}

/**
 * Tenant dashboard stats (used inside tenant dashboard)
 * ✅ Kept as-is for backward compatibility with existing UI/usage.
 */
export async function getTenantDashboardStats(
  tenantId: Types.ObjectId
): Promise<TenantDashboardStats> {
  await connectDB();

  const [activeProjects, archivedProjects, membersCount] = await Promise.all([
    Project.countDocuments({ tenantId, status: "active", deletedAt: null }).exec(),
    Project.countDocuments({ tenantId, status: "archived", deletedAt: null }).exec(),
    Membership.countDocuments({ tenantId, status: { $ne: "removed" } }).exec(),
  ]);

  return {
    activeProjects,
    archivedProjects,
    membersCount,
    chartData: [
      { name: "Active", value: activeProjects },
      { name: "Archived", value: archivedProjects },
    ],
  };
}

/**
 * ✅ NEW — Tenant Analytics Stats (Module 3)
 * Route: GET /api/tenant/:tenantId/analytics
 *
 * Rules (as per spec):
 * - active projects:   { tenantId, status: "active",   deletedAt: null }
 * - archived projects: { tenantId, status: "archived", deletedAt: null }
 * - members:           { tenantId, status: "active" }
 *
 * Errors:
 * - invalid tenantId -> 400
 * - tenant not found -> 404
 */
export async function getTenantAnalyticsStats(
  tenantId: string
): Promise<TenantAnalyticsStats> {
  await connectDB();

  // 1) Validate tenantId param
  if (!mongoose.isValidObjectId(tenantId)) {
    throw httpError(400, "Invalid tenantId");
  }

  const tenantObjectId = new mongoose.Types.ObjectId(tenantId) as Types.ObjectId;

  // 2) Tenant existence check (recommended)
  const tenantExists = await Tenant.exists({ _id: tenantObjectId });
  if (!tenantExists) {
    throw httpError(404, "Tenant not found");
  }

  // 3) Count in parallel (fast + clean)
  const [activeProjects, archivedProjects, membersCount] = await Promise.all([
    Project.countDocuments({
      tenantId: tenantObjectId,
      status: "active",
      deletedAt: null, // matches null OR missing (good for soft-delete)
    }),
    Project.countDocuments({
      tenantId: tenantObjectId,
      status: "archived",
      deletedAt: null,
    }),
    Membership.countDocuments({
      tenantId: tenantObjectId,
      status: "active",
    }),
  ]);

  return {
    activeProjects,
    archivedProjects,
    membersCount,
  };
}
