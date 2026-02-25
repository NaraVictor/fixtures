# App Audit: Bugs, Security, Performance, General Fixes

## 1. Bugs (fixed or documented)

| Issue | Location | Status |
|-------|----------|--------|
| **Team filter URL out of sync** | Home filters: clearing the team input set `teamSlug` to null but did not update the URL, so state and URL diverged. | **Fixed**: `onChange` now calls `setTeam(null)` when input is cleared so the URL updates. |
| **Invalid date in betslip** | `GET /api/betslip?date=...`: arbitrary or invalid date strings were used as-is. | **Fixed**: Date is validated with `/^\d{4}-\d{2}-\d{2}$/`; invalid values fall back to today. |
| **Home status param** | `?status=...` was passed through to the query without validation. | **Fixed**: Only `scheduled`, `live`, or `finished` are accepted; other values are ignored. |
| **Fixture double fetch** | `getFixture(slug)` was called in both `generateMetadata` and the page component. | **Fixed**: Wrapped in `cache()` from React so the same request is deduplicated. |

## 2. Security (fixed or documented)

| Issue | Location | Status |
|-------|----------|--------|
| **Office import unprotected** | `POST /api/office/import` used service role with no auth. Any client could trigger CSV import. | **Fixed**: Route now requires authenticated user and admin check (same as other office APIs). |
| **CRON_SECRET timing attack** | Cron routes used `auth !== \`Bearer ${CRON_SECRET}\``. | **Fixed**: Use `secureCompare(token, secret)` in both cron routes. |
| **Office config arbitrary weights** | `weights` from body was written to DB as-is; could store arbitrary keys. | **Fixed**: Only allowed keys are accepted; values are validated and clamped; configId must be a UUID. |
| **Office teams PATCH** | No length or format validation on name/slug; no UUID check on id. | **Fixed**: Name/slug max length, slug pattern `[a-z0-9]+(-[a-z0-9]+)*`, team id validated as UUID. |
| **Middleware when Supabase env missing** | If `NEXT_PUBLIC_SUPABASE_URL` or anon key is missing, middleware returns next() without refreshing session. | **Documented**: Consider returning 503 or redirect when env is misconfigured. |

## 3. Performance (fixed or documented)

| Issue | Location | Status |
|-------|----------|--------|
| **getFixture called twice** | Fixture page + generateMetadata. | **Fixed**: `getFixture` wrapped in `cache()`. |
| **Daily picks N+1** | Fixture details (home/away/league names) fetched per pick in a loop. | **Documented**: Could batch into one query with `.in("id", fixtureIds)` and join; left as-is for clarity. |
| **update-results loop** | Each prediction updated with a separate round-trip; fixture.ended_at updated per prediction. | **Documented**: Could batch prediction updates; ended_at updates are idempotent. |
| **API /api/teams** | Fetches up to `limit` rows then filters by `q` in memory. | **Documented**: For large datasets, filter in DB with `.ilike("name", `%${q}%`)` when `q` is present. |

## 4. General fixes applied

- **Betslip**: Valid date format only (`YYYY-MM-DD`).
- **Home**: Status restricted to `scheduled` | `live` | `finished`.
- **Office config**: UUID validation for configId; sanitized weights (allowed keys + numeric/clamped); merge with existing weights so partial updates don’t wipe other keys.
- **Office teams**: UUID for team id; name/slug length and slug format; trim and normalize slug to lowercase.
- **Cron**: Constant-time comparison for CRON_SECRET via `lib/auth/secure-compare.ts`.

## 5. Recommendations (not implemented)

- **Rate limiting**: Add rate limiting for public APIs (`/api/teams`, `/api/betslip`, `/api/leagues`) to reduce abuse (e.g. Vercel or Upstash).
- **Fixture slug validation**: Limit slug length or pattern in DB and in URL to avoid abuse (e.g. very long paths).
- **Frontier LLM**: Inputs are from your DB; if you ever pass user-generated text into the prompt, sanitize to reduce prompt-injection risk.
- **Session refresh in middleware**: Supabase recommends calling `supabase.auth.getUser()` in middleware to refresh the session; current code does that. Ensure cookies are forwarded correctly in all environments.
