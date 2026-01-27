// FILE: client/src/pages/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full border rounded-lg p-6 text-sm space-y-3">
        <div className="text-lg font-semibold">404 — Not Found</div>
        <p className="text-muted-foreground">The page you’re looking for doesn’t exist.</p>
        <Link className="border rounded px-3 py-1 inline-block" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
