// FILE: client/src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "../App";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import PlatformLayout from "../layouts/PlatformLayout";
import TenantLayout from "../layouts/TenantLayout";

import Landing from "../pages/public/Landing";
import Features from "../pages/public/Features";
import Docs from "../pages/public/Docs";
import Security from "../pages/public/Security";
import Pricing from "../pages/public/Pricing";
import Contact from "../pages/public/Contact";

import SignIn from "../pages/auth/SignIn";
import SignUp from "../pages/auth/SignUp";

import PlatformDashboard from "../pages/platform/PlatformDashboard";
import AuditLogs from "../pages/platform/AuditLogs";

import TenantDashboard from "../pages/tenant/TenantDashboard";
import ProjectsList from "../pages/tenant/ProjectsList";

import Members from "../pages/tenant/Members";
import Invites from "../pages/tenant/Invites";
import Analytics from "../pages/tenant/Analytics";
import Settings from "../pages/tenant/Settings";
import SelectTenant from "../pages/tenant/SelectTenant";

import AcceptInvite from "../pages/tenant/AcceptInvite";

import NotFound from "../pages/NotFound";

import ProtectedRoute from "../components/guards/ProtectedRoute";
import RoleGate from "../components/guards/RoleGate";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <Landing /> },
          { path: "docs", element: <Docs /> },
          { path: "security", element: <Security /> },
          { path: "features", element: <Features /> },
          { path: "pricing", element: <Pricing /> },
          { path: "contact", element: <Contact /> },
        ],
      },

      {
        element: <AuthLayout />,
        children: [
          { path: "sign-in", element: <SignIn /> },
          { path: "sign-up", element: <SignUp /> },
        ],
      },

      {
        path: "select-tenant",
        element: (
          <ProtectedRoute>
            <SelectTenant />
          </ProtectedRoute>
        ),
      },

      // ✅ NEW: invite acceptance page
      // IMPORTANT:
      // Keep this OUTSIDE TenantLayout so pending users can access it
      // before tenant membership exists.
      {
        path: "t/:tenantSlug/invites/accept",
        element: (
          <ProtectedRoute>
            <AcceptInvite />
          </ProtectedRoute>
        ),
      },

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
          { path: "audit-logs", element: <AuditLogs /> },
        ],
      },

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
          { path: "dashboard", element: <TenantDashboard /> },

          {
            path: "members",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]} tenantDenyTo="/select-tenant">
                <Members />
              </RoleGate>
            ),
          },
          {
            path: "invites",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]} tenantDenyTo="/select-tenant">
                <Invites />
              </RoleGate>
            ),
          },
          {
            path: "analytics",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]} tenantDenyTo="/select-tenant">
                <Analytics />
              </RoleGate>
            ),
          },
          {
            path: "settings",
            element: (
              <RoleGate allowTenantRoles={["tenantAdmin"]} tenantDenyTo="/select-tenant">
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