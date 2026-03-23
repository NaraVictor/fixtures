"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export function BottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const homeActive = pathname === "/" && hash !== "#matches";
  const picksActive = pathname === "/" && hash === "#matches";
  const profileActive = pathname.startsWith("/office");

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Main navigation">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[var(--nav-pill-border)] bg-[var(--nav-pill-bg)] px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl dark:shadow-[0_8px_36px_rgba(0,0,0,0.45)]">
        <NavIcon
          href="/"
          label="Home"
          icon="solar:home-2-linear"
          active={homeActive}
          onClick={(e) => {
            if (pathname === "/" && window.location.hash === "#matches") {
              e.preventDefault();
              window.history.replaceState(null, "", "/");
              setHash("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        />
        <NavIcon
          href="/#matches"
          label="Picks"
          icon="solar:football-linear"
          active={picksActive}
        />
        <NavIcon
          href="/office"
          label="Profile"
          icon="solar:user-circle-linear"
          active={profileActive}
        />
        <div className="mx-0.5 h-5 w-px shrink-0 bg-[var(--nav-pill-border)]" aria-hidden />
        <NavThemeToggle />
      </div>
    </nav>
  );
}

function NavIcon({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-[color,transform,background-color] duration-200 ease-out active:scale-95 motion-reduce:transition-colors motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
        active
          ? "bg-[var(--color-primary)] text-white shadow-sm"
          : "text-[var(--nav-pill-icon)] hover:text-[var(--text-primary)]"
      }`}
      aria-label={label}
      aria-current={active ? "page" : undefined}>
      <Icon icon={icon} className="h-[1.35rem] w-[1.35rem]" aria-hidden />
    </Link>
  );
}

function NavThemeToggle() {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const resolved =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setMode(resolved);
  }, []);

  const toggle = useCallback(() => {
    const next = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setMode(next);
  }, [mode]);

  if (!mounted) {
    return <span className="inline-flex h-11 w-11 shrink-0 rounded-full" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--nav-pill-icon)] transition-[color,transform] duration-200 ease-out hover:text-[var(--text-primary)] active:scale-95 motion-reduce:transition-colors motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
      aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={mode === "dark" ? "Light mode" : "Dark mode"}>
      <Icon
        icon={mode === "dark" ? "solar:sun-2-linear" : "solar:moon-linear"}
        className="h-[1.35rem] w-[1.35rem]"
        aria-hidden
      />
    </button>
  );
}
