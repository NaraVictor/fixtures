import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function OfficePage() {
  return (
    <main className="min-h-screen">
      <div className="container-narrow py-6 md:py-8">
        <Breadcrumbs
          items={[{ label: "Picks", href: "/" }, { label: "Office" }]}
        />

        <header className="mt-4">
          <h1 className="text-heading-1">Office</h1>
          <p className="mt-1 text-body text-[var(--text-secondary)]">
            Control centre for data, teams, and how we score matches. Live when
            the backend is connected.
          </p>
        </header>

        <nav
          className="mt-8 flex flex-col gap-0 border-y border-[var(--border-color)]"
          aria-label="Office sections">
          <OfficeSection
            title="Data"
            description="Import fixtures, update results, sync leagues."
            status="Connect backend"
          />
          <OfficeSection
            title="Teams"
            description="Manage clubs, squads, and key players."
            status="Connect backend"
          />
          <OfficeSection
            title="Ranking"
            description="Weights and scoring rules for pick confidence."
            status="Connect backend"
          />
        </nav>

        <footer className="mt-10">
          <Link
            href="/"
            className="text-body font-medium text-[var(--color-primary)] hover:underline">
            ← Back to picks
          </Link>
        </footer>
      </div>
    </main>
  );
}

function OfficeSection({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <section
      className="flex flex-col gap-1 border-b border-[var(--border-color)] py-5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      aria-labelledby={`office-${title.toLowerCase()}`}>
      <div className="min-w-0">
        <h2
          id={`office-${title.toLowerCase()}`}
          className="text-heading-2 text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-1 text-body text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      <span
        className="mt-2 shrink-0 text-caption text-[var(--text-muted)] sm:mt-0"
        aria-label={`Status: ${status}`}>
        {status}
      </span>
    </section>
  );
}
