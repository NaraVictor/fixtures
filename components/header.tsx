import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-primary)]/80">
      <div className="container-narrow flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-heading-2 shrink-0 font-bold tracking-tight text-[var(--text-primary)] transition-opacity duration-150 hover:opacity-90"
        >
          Golden Goal
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-body text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
          >
            Picks
          </Link>
          <Link
            href="/office"
            className="text-body text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
          >
            Office
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
