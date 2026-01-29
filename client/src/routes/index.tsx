// FILE: client/src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "../App";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import PlatformLayout from "../layouts/PlatformLayout";
import TenantLayout from "../layouts/TenantLayout";

import Landing from "../pages/public/Landing";
import Docs from "../pages/public/Docs";
import SignIn from "../pages/auth/SignIn";
import SignUp from "../pages/auth/SignUp";
import PlatformDashboard from "../pages/platform/PlatformDashboard";
import TenantDashboard from "../pages/tenant/TenantDashboard";
import ProjectsList from "../pages/tenant/ProjectsList";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "../components/guards/ProtectedRoute";
import RoleGate from "../components/guards/RoleGate";
import Security from "../pages/public/Security";
import Pricing from "../pages/public/Pricing";
import Contact from "../pages/public/Contact";

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
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
