// FILE: client/src/App.tsx
import { Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  // ✅ Run session restore once at app root
  useAuth({ bootstrap: true });

  return <Outlet />;
}
