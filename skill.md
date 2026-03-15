# Quant-Tipster Logic v2.0 (The Mean Reversion Edition)

## I. Mathematical Frameworks

- **Poisson λ / Fair Odds:** Determine "Fair Odds" using λ (expected goals) from a **10-game rolling xG** for both teams. Use this as the baseline for value assessment.
- **Kelly Criterion:** Use $f^* = (bp - q) / b$ to calculate stake units (1–5).
- **Decay Function:** Weight last 2 seasons at 70%, seasons 3–5 at 20%, and 6–10 at 10%.
- **Mean Reversion Audit (MRA):**
  - Compare **Actual Goals (AG)** vs **Expected Goals (xG)** over the rolling window.
  - If a team is **over-performing xG by >30%** (Luck Variance), apply a **confidence penalty** — they are due for negative regression.
  - If a team is **under-performing** (Value Variance), **prioritize as a recovery pick** — market may still price in poor results.

## II. Strategic Constraints

- **Fatigue Factor / Rest Rule:** Apply **-12%** rating for teams on a **3-game-in-8-day** cycle; cap "Team Goals Over" at **1.5** (insufficient recovery reduces high-intensity output in final 20 min). Aligns with Institutional Alpha §2 Rest Rule (-5% confidence when used there).
- **The Efficiency Filter:** Focus on leagues where bookmaker models have higher variance (e.g. **Saudi Pro League**, **European Conference League**) compared to the EPL when seeking edge.
- **CLV Benchmark:** Every pick must have a projected probability that **beats the closing bookmaker line by at least 3.5%** (Closing Line Value). See also **CLV Guard** in § Institutional Alpha.

## III. Confidence Grading

- **9.0+:** Banker. Passed MRA, no fatigue, >20% value edge.
- **8.0–8.9:** Solid. MRA stable, minor fatigue or lower liquidity.
- **<8.0:** Volatile. Avoid unless `{{allow_volatility}}` is enabled.

## IV. Mandatory Filters

- **No-Bet Zone:** Skip games with internal club crises, interim managers (first game), or "dead rubber" end-of-season fixtures.

## IVb. Prediction commentary — no technical terms

- **Keep prediction reason free of technical terms.** All user-facing commentary (`frontier_explanation`, `logic_audit.reasoning`) must use **only simple, everyday language**. Do **not** use jargon or abbreviations such as MoE, CLV, xG, MRA, λ, overround, or similar.
- Describe *what* matters in plain words (e.g. "we trim 7% off the raw chance to allow for the bookmaker’s edge", "odds moved against us before kick-off", "they’re scoring more than their chances suggest", "their main striker is out") without introducing technical labels.
- Keep sentences short and concrete.

---

## Institutional Alpha Standard (v5.9)

Mathematical constraints and contextual filters for professional-grade prediction and bankroll protection. Apply **after** base probability/score; subtract the stated % from Confidence (cumulative where multiple apply). Store applied flags in `local_model_output` or `criteria_snapshot` for audit (e.g. `alpha_7_applied`, `capitulation_12_5_applied`, `travel_penalty`, `market_opposed`, `rest_cap`, `precipitation_penalty`, `chaos_filter`, `red_card_carryover`).

### 1. Mathematical Buffers & Market Efficiency

- **The 7% Alpha Rule (MoE):** Subtract **7%** from raw win probabilities to account for bookmaker overrounds and late-market efficiency. Apply first to base confidence.
- **The Capitulation Multiplier (12.5%):** For teams in the **bottom quartile for "Goals Conceded after 75 mins"** (e.g. Tottenham, West Ham), increase the MoE to **12.5%** for all defensive/win markets (replace 7% with 12.5% when this flag applies).
- **Closing Line Value (CLV) Guard:** If odds move **>5%** against your position within 2 hours of kick-off, reduce Confidence by **-10%**. Flag as **"Market-Opposed"**; requires odds history at pick time or in update-results.

### 2. High-Impact Contextual Multipliers

- **The Travel Penalty (-10%):** Subtract **10%** from Confidence for away favorites traveling **>360 km (225 miles)** or crossing time zones.
- **The Rest Rule (-5%):** If a team has played **3 matches in 8 days**, cap **"Team Goals Over"** at **1.5**; for 1x2 reduce Confidence by **-5%** when fixture congestion indicates insufficient recovery.
- **The Surface Penalty (Artificial Turf):** Increase **Total Goals Over** confidence by **+5%** for home teams on artificial pitches (e.g. Bodo/Glimt).

### 3. Personnel & "Keyman" Multipliers

- **Tier 1 (Scoring Engine):** **-20% Confidence** if the primary scorer is out.
  - **Mitigation Rule:** If a secondary player shows a λ-delta of **>0.8** over 2 games (e.g. Valverde), reduce penalty to **-5%**.
- **Tier 2 (Defensive Anchor):** **-10% Confidence** if the primary tactical stabilizer is out (e.g. Rodri, Van Dijk).

Align with `key_man_weight` and lineup data when role/impact is known.

### 4. Systemic Filters (v5.9 Emergency Updates)

- **The "Chaos Filter" (Tottenham Rule):** Teams with an **8+ game winless run** are **"Untouchable"** for Win markets. Pivot to **"Opponent Team Goals Over"** or **"Total Cards Over."**
- **The Red Card Carryover:** Apply a **-15% Confidence Penalty** to the next 1X2 market for any team that received a red card in their previous fixture.
- **Referee Penalty Alpha:** If a referee's **λ_pen > 0.30**, increase **"Penalty Awarded"** confidence in high-dribble matchups (e.g. top 5 dribblers in league).

### 5. Environmental Hedges

- **Humidity / Slick Pitch (>60%):** Prioritize **Total Corners Over 8.5**; wet conditions increase parries, long-range attempts, deflected crosses.
- **Precipitation Penalty:** In heavy rain or snow, reduce **"Over 2.5 Goals"** by **-15%**. Pivot to Under or **Total Cards Over**.

**Application order:** 7% (or 12.5% capitulation) alpha → contextual (travel, rest, surface, keyman, CLV) → systemic (chaos filter, red card carryover) → environmental/referee for the chosen market.

---

## V. Ranking / Selection Logic (Fixture Scoring)

Use this to **prioritize which fixtures to pick** when outputting a limited number of games. Compute a composite score (0–1) per fixture; prefer higher scores. Apply MRA and confidence grading above before finalizing picks.

### Inputs (use when available)

- **xG:** Expected goals (home/away) from fixture_stats or historical (e.g. 10-game rolling).
- **Shots on target:** shots_on_target_home, shots_on_target_away.
- **Home advantage:** Fixed boost for home side (e.g. ~0.1 weight).
- **Lineup/formation:** Known lineup or formation → small boost (data quality).
- **Key man absence:** Downgrade side with key/high-impact absences; small boost when opposition has key absences. Use **Keyman Crisis** tiers (Tier 1 -20%, Tier 2 -10%) when role/impact is known.

### Weights (normalized, sum to 1)

| Factor                 | Weight | Notes                                |
| ---------------------- | ------ | ------------------------------------ |
| xg_weight              | 0.15   | Normalize total xG (e.g. cap at 4)   |
| form_weight            | 0.20   | Recent results / goal difference     |
| h2h_weight             | 0.10   | Head-to-head                         |
| home_advantage_weight  | 0.10   | Apply ~0.5 base for home             |
| shots_on_target_weight | 0.15   | Normalize SoT (e.g. cap at 20 total) |
| lineup_weight          | 0.10   | Add if lineup known; 0 if missing    |
| key_man_weight         | 0.10   | Adjust for key absences (see above)  |

### Scoring Rules

1. Start base score at **0.5**.
2. **xG:** If xG_home + xG_away > 0, add `min(1, (xg_home + xg_away) / 4) * xg_weight`.
3. **Shots on target:** If SoT total > 0, add `min(1, (sot_home + sot_away) / 20) * shots_on_target_weight`.
4. **Home advantage:** Add `home_advantage_weight * 0.5`.
5. **Lineup:** If lineup/formation is known, add `lineup_weight`; otherwise 0.
6. **Key man:** If away has key absence and home does not, add `key_man_weight`. If home has key absence, subtract `key_man_weight`.
7. Clamp final score to **[0, 1]**.

When asked for exactly N games, **sort fixtures by this composite score descending** and return the top N (subject to mandatory filters, no-bet zone, and confidence grading). Before final confidence_score, apply **Institutional Alpha Standard (v5.9)** where data exists (§1 alpha/capitulation/CLV → §2 travel/rest/surface → §3 keyman → §4 systemic → §5 environmental/referee for the market).

---

## VI. Prediction Schema & Implementation (synced with .cursor/skills)

**Canonical source:** this file. **Implementation skill:** `.cursor/skills/fixtures-predictions/SKILL.md` — keep professional quant logic (Quant-Tipster, Institutional Alpha, weights, scoring rules) in sync when editing either.

Quant logic and constraints implemented in the Fixtures app; use when changing pick logic, crons, or schema.

### Schema

- **ranking_config:** name, is_active, weights (jsonb). Active row used by daily-picks. Weights: xg_weight, form_weight, h2h_weight, home_advantage_weight, shots_on_target_weight, lineup_weight, key_man_weight.
- **prediction_runs:** run_at, league_ids, num_picks, criteria_snapshot (jsonb of weights). One row per daily run.
- **predictions:** fixture_id, prediction_run_id, status (pending | won | lost | void), prediction_type (e.g. "1x2"), predicted_value (e.g. "1", "X", "2"), confidence_score, model_version, local_model_output (jsonb), frontier_explanation (text), actual_result (jsonb). One row per pick per fixture per run.

### Scorer & Cron

- **Scorer:** `scoreFixture(fixture, weights)` returns 0–1. Uses fixture_stats (xG, shots on target), home advantage, hasLineup, keyManAbsenceHome/keyManAbsenceAway. Weights from ranking_config; clamp to [0, 1]. Apply **Institutional Alpha Standard (v5.9)** adjustments to confidence_score before persist (alpha/capitulation, travel, rest, surface, keyman, CLV, chaos filter, red card carryover, environmental/referee).
- **Daily Picks:** `GET /api/cron/daily-picks` (Bearer CRON_SECRET). Load today’s fixtures (scheduled/live), active weights, optional fixture_stats/lineups; score each; sort desc; take top 10; insert one prediction_run and one prediction per top fixture (prediction_type "1x2", predicted_value "1", confidence_score = adjusted score, status "pending").
- **Update Results:** `GET /api/cron/update-results`. Load pending predictions and finished fixtures (home_goals/away_goals set); set each prediction correct/incorrect/void by prediction_type and predicted_value; set actual_result jsonb.

### Prediction Types

- **1x2:** "1" = home win, "X" = draw, "2" = away win. Extend update-results when adding over_under, corners, cards, or penalties.

### Constraints

- Store Alpha Standard (v5.9) applied flags in prediction `local_model_output` or run `criteria_snapshot` for audit and backtest (e.g. alpha_7_applied, capitulation_12_5_applied, travel_penalty, rest_cap, surface_penalty, keyman_tier, market_opposed, chaos_filter, red_card_carryover, precipitation_penalty, referee_pen_alpha).
- Add new factors to ranking_config.weights and scorer when data is available (e.g. travel distance, fixture congestion, weather, referee λ_pen, goals conceded after 75', red card in previous fixture, winless run length).
