// FILE: client/src/layouts/PlatformLayout.tsx
import { Outlet } from "react-router-dom";
import PageShell from "../components/common/PageShell";

export default function PlatformLayout() {
  return (
    <PageShell title="Platform Dashboard">
      <Outlet />
    </PageShell>
  );
}
