// FILE: client/src/components/common/ThemeToggle.tsx
import { useMemo } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../store/theme.store";

type ThemeMode = "light" | "dark" | "system";

export default function ThemeToggle() {
  // ✅ Be tolerant to store naming (theme/mode + setTheme/setMode)
  const stored = useTheme((s: any) => (s?.theme ?? s?.mode ?? "system") as ThemeMode);
  const setTheme = useTheme((s: any) => (s?.setTheme ?? s?.setMode) as ((t: ThemeMode) => void) | undefined);

  const effective: "light" | "dark" = useMemo(() => {
    const isDark = document.documentElement.classList.contains("dark");
    return isDark ? "dark" : "light";
  }, [stored]);

  const next: ThemeMode = effective === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme?.(next)}
      aria-label="Toggle theme"
      title={effective === "dark" ? "Switch to light" : "Switch to dark"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
    >
      {effective === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}