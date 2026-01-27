// FILE: client/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-lg p-6">
        <Outlet />
      </div>
    </div>
  );
}


