# Design system

Lightweight design system for Alpha Quant. Tokens live in `app/globals.css`; reusable components in `components/ui/`.

## Tokens (CSS variables)

- **Font**: `--font-sans`, `--font-mono` (body uses `--font-sans`; override for a custom typeface).
- **Brand**: `--color-primary`, `--color-primary-hover`, `--color-primary-muted`, `--color-accent`, `--color-accent-muted`
- **Surfaces**: `--bg-primary`, `--bg-secondary`, `--bg-card`
- **Text**: `--text-primary`, `--text-secondary`, `--text-muted`
- **Borders**: `--border-color`
- **Semantic (predictions)**: `--success-bg` / `--success-text`, `--incorrect-bg` / `--incorrect-text`, `--pending-bg` / `--pending-text`

All tokens support light theme (default), `[data-theme="dark"]`, and `prefers-color-scheme: dark`.

## Typography classes

- `.text-heading-1` – Page title (clamp 1.5rem–2rem)
- `.text-heading-2` – Section title (1.25rem)
- `.text-body` – Body copy
- `.text-caption` – Secondary/meta text

## Components

- **StatusBadge** (`components/ui/status-badge.tsx`) – Prediction status: correct, incorrect, pending, void. Uses `.badge` and `.badge--*` variants.
- **ThemeToggle** (`components/theme-toggle.tsx`) – Light / dark / system.

## Layout & patterns

- **Container**: `.container-narrow` – max-width 1024px, fluid horizontal padding (`clamp(1rem, 4vw, 1.5rem)`).
- **Card**: `.card` – Elevated surface, hover lift, used for prediction rows and detail sections.
- **Pills**: Filter pills use `.pill-press` (active press feedback) and `.tap-target` (min 44×44px for touch).

## Motion

- Transitions use `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out) where appropriate.
- `prefers-reduced-motion: reduce` disables card lift, badge/pill transforms, and confidence-pill hover.

## Usage

- Prefer semantic tokens over raw colors (e.g. `var(--text-secondary)` not hex).
- Use shared `formatDate` / `formatDateTime` from `lib/format.ts` for dates.
- New UI components that repeat 3+ times or carry semantic meaning belong in `components/ui/` with clear props and accessibility.
