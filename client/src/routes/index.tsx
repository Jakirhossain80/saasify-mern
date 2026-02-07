// FILE: client/src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "../App";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import PlatformLayout from "../layouts/PlatformLayout";
import TenantLayout from "../layouts/TenantLayout";

import Landing from "../pages/public/Landing";
import Docs from "../pages/public/Docs";
import Security from "../pages/public/Security";
import Pricing from "../pages/public/Pricing";
import Contact from "../pages/public/Contact";

import SignIn from "../pages/auth/SignIn";
import SignUp from "../pages/auth/SignUp";

import PlatformDashboard from "../pages/platform/PlatformDashboard";
import AuditLogs from "../pages/platform/AuditLogs"; // ✅ Feature #5

import TenantDashboard from "../pages/tenant/TenantDashboard";
import ProjectsList from "../pages/tenant/ProjectsList";

// ✅ Tenant placeholder pages (Phase 7)
import Members from "../pages/tenant/Members";
import Invites from "../pages/tenant/Invites";
import Analytics from "../pages/tenant/Analytics";
import Settings from "../pages/tenant/Settings";

// ✅ Add SelectTenant route/page
import SelectTenant from "../pages/tenant/SelectTenant";

import NotFound from "../pages/NotFound";

import ProtectedRoute from "../components/guards/ProtectedRoute";
import RoleGate from "../components/guards/RoleGate";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      // Public
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <Landing /> },
          { path: "docs", element: <Docs /> },
          { path: "security", element: <Security /> },
          { path: "pricing", element: <Pricing /> },
          { path: "contact", element: <Contact /> },
        ],
      },

      // Auth
      {
        element: <AuthLayout />,
        children: [
          { path: "sign-in", element: <SignIn /> },
          { path: "sign-up", element: <SignUp /> },
        ],
      },

      // ✅ Select tenant (Protected)
      {
        path: "select-tenant",
        element: (
          <ProtectedRoute>
            <SelectTenant />
          </ProtectedRoute>
        ),
      },

      // Platform (platformAdmin only)
      {
        path: "platform",
        element: (
          <ProtectedRoute>
            <RoleGate allowPlatformRoles={["platformAdmin"]}>
              <PlatformLayout />
            </RoleGate>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <PlatformDashboard /> },
          { path: "audit-logs", element: <AuditLogs /> }, // ✅ Feature #5
        ],
      },

      // Tenant scoped
      {
        path: "t/:tenantSlug",
        element: (
          <ProtectedRoute>
            <TenantLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <TenantDashboard /> },
          { path: "projects", element: <ProjectsList /> },

          // ✅ Optional alias: /t/:tenantSlug/dashboard
          { path: "dashboard", element: <TenantDashboard /> },

          // ✅ Phase 7: routed placeholder pages (tenantAdmin UX gating)
          {
            path: "members",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]}>
                <Members />
              </RoleGate>
            ),
          },
          {
            path: "invites",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]}>
                <Invites />
              </RoleGate>
            ),
          },
          {
            path: "analytics",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]}>
                <Analytics />
              </RoleGate>
            ),
          },
          {
            path: "settings",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]}>
                <Settings />
              </RoleGate>
            ),
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
