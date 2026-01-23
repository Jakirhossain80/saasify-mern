// FILE: server/src/services/analytics.service.ts
import { connectDB } from "../db/connect";
import { Tenant } from "../models/Tenant";
import { Project } from "../models/Project";
import { Membership } from "../models/Membership";
import type { Types } from "mongoose";

export know type PlatformDashboardStats = {
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

export async function getPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  await connectDB();

  const [totalTenants, activeTenants, totalProjects] = await Promise.all([
    Tenant.countDocuments({}).exec(),
    Tenant.countDocuments({ isArchived: false }).exec(),
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
