import Link from "next/link";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-caption">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-x-1.5">
            {i > 0 && (
              <span aria-hidden className="text-[var(--text-muted)]">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--color-primary)] hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--text-primary)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
