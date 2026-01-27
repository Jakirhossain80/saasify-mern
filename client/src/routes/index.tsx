// FILE: client/src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "../App";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import PlatformLayout from "../layouts/PlatformLayout";
import TenantLayout from "../layouts/TenantLayout";

import Landing from "../pages/public/Landing";
import SignIn from "../pages/auth/SignIn";
import PlatformDashboard from "../pages/platform/PlatformDashboard";
import TenantDashboard from "../pages/tenant/TenantDashboard";
import ProjectsList from "../pages/tenant/ProjectsList";
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
          // add more public routes here (pricing, docs, etc.)
        ],
      },

      // Auth
      {
        element: <AuthLayout />,
        children: [{ path: "sign-in", element: <SignIn /> }],
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
        children: [{ index: true, element: <PlatformDashboard /> }],
      },

      // Tenant scoped: /t/:tenantSlug/*
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
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
