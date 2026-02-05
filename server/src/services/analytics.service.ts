// FILE: server/src/services/analytics.service.ts
import { connectDB } from "../db/connect";
import { Tenant } from "../models/Tenant";
import { Project } from "../models/Project";
import { Membership } from "../models/Membership";
import type { Types } from "mongoose";

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

export type TenantDashboardStats = {
  activeProjects: number;
  archivedProjects: number;
  membersCount: number;
  chartData: Array<{ name: string; value: number }>;
};

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
