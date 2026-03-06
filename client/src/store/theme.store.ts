import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  init: () => void;
};

const STORAGE_KEY = "saasify-theme";

function getSystemPref(): "light" | "dark" {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyMode(mode: ThemeMode) {
  const root = document.documentElement; // <html>
  const resolved = mode === "system" ? getSystemPref() : mode;

  root.classList.toggle("dark", resolved === "dark");
}

export const useTheme = create<ThemeState>((set, get) => ({
  mode: "system",

  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
    applyMode(mode);
  },

  init: () => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
    set({ mode: saved });
    applyMode(saved);

    // If user uses "system", react to system theme changes
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;

    const onChange = () => {
      if (get().mode === "system") applyMode("system");
    };

    // modern + fallback
    mq.addEventListener?.("change", onChange);
    mq.addListener?.(onChange);

    // Optional cleanup not needed unless you re-init multiple times
  },
}));
