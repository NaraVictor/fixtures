import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-primary)]/75">
      <div className="container-wide flex h-12 items-center justify-center sm:justify-start">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[var(--text-primary)] transition-opacity hover:opacity-90"
        >
          Golden Goal
        </Link>
      </div>
    </header>
  );
}
