function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function TeamAvatar({
  name,
  className = "",
  variant = "default",
  surface = "theme",
}: {
  name: string;
  className?: string;
  variant?: "default" | "onDark";
  /** match = uses --match-card-* tokens (light + dark) */
  surface?: "theme" | "light" | "match";
}) {
  const label = initials(name);
  const base =
    variant === "onDark"
      ? "bg-white/15 text-white ring-2 ring-white/25"
      : surface === "light" || surface === "match"
        ? "bg-primary/20 text-[var(--match-card-text)] ring-2 ring-[var(--match-card-border)]"
        : "bg-primary/25 text-[var(--text-primary)] ring-2 ring-[var(--border-color)]";
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold tabular-nums ${base} ${className}`}
      aria-hidden>
      {label}
    </span>
  );
}
