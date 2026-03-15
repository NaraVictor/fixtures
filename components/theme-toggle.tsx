"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

type Theme = "light" | "dark" | "system";

const THEMES: { value: Theme; icon: string; label: string }[] = [
  { value: "light", icon: "mdi:white-balance-sunny", label: "Light" },
  { value: "dark", icon: "mdi:weather-night", label: "Dark" },
  { value: "system", icon: "mdi:monitor", label: "System" },
];

const DEFAULT_THEME: Theme = "dark";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem("theme") as Theme) || DEFAULT_THEME;
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  function applyTheme(next: Theme) {
    const root = document.documentElement;
    if (next === "system") {
      root.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    }
    setThemeState(next);
  }

  if (!mounted) {
    return (
      <div className="flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1 gap-0.5" aria-hidden>
        <span className="h-8 w-20 rounded-full bg-[var(--border-color)]" />
      </div>
    );
  }

  return (
    <div
      className="flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1 gap-0.5"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {THEMES.map(({ value: t, icon, label }) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={theme === t}
          aria-label={label}
          title={label}
          onClick={() => applyTheme(t)}
          className={`rounded-full p-2 transition-transform duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-95 ${
            theme === t
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--border-color)]/50"
          }`}
        >
          <Icon icon={icon} className="h-5 w-5" aria-hidden />
        </button>
      ))}
    </div>
  );
}
