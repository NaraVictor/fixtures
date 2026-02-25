# Quant-Tipster Logic v1.2

## Analytical Frameworks

- **Poisson Distribution:** Calculate λ (expected goals) for both teams based on 10-game rolling xG.
- **Kelly Criterion:** Use $f^* = (bp - q) / b$ to calculate stake units (1-5).
- **Decay Function:** Weight last 2 seasons at 70%, seasons 3-5 at 20%, and 6-10 at 10%.

## Professional Heuristics

1. **Fatigue Penalty:** -12% performance rating for teams playing their 3rd game in 8 days.
2. **Mean Reversion:** Flag teams over-performing their xG by >25% as "due for negative regression."
3. **CLV (Closing Line Value):** Estimate if the current price offers a >3% edge over predicted closing odds.

## Mandatory Filters

- **No-Bet Zone:** Skip games with internal club crises, interim managers (first game), or "dead rubber" end-of-season fixtures.

---

## Ranking / Selection Logic (Fixture Scoring)

Use this to **prioritize which fixtures to pick** when outputting a limited number of games. Compute a composite score (0–1) per fixture; prefer higher scores.

### Inputs (use when available)

- **xG:** Expected goals (home/away) from fixture_stats or historical.
- **Shots on target:** shots_on_target_home, shots_on_target_away.
- **Home advantage:** Fixed boost for home side (e.g. ~0.1 weight).
- **Lineup/formation:** Known lineup or formation → small boost (data quality).
- **Key man absence:** Downgrade side with key/high-impact absences; small boost when opposition has key absences.

### Weights (normalized, sum to 1)

| Factor                 | Weight | Notes                                      |
|------------------------|--------|--------------------------------------------|
| xg_weight              | 0.15   | Normalize total xG (e.g. cap at 4)         |
| form_weight            | 0.20   | Recent results / goal difference           |
| h2h_weight             | 0.10   | Head-to-head                                |
| home_advantage_weight  | 0.10   | Apply ~0.5 base for home                    |
| shots_on_target_weight| 0.15   | Normalize SoT (e.g. cap at 20 total)       |
| lineup_weight          | 0.10   | Add if lineup known; 0 if missing           |
| key_man_weight         | 0.10   | Adjust for key absences (see above)         |

### Scoring Rules

1. Start base score at **0.5**.
2. **xG:** If xG_home + xG_away > 0, add `min(1, (xg_home + xg_away) / 4) * xg_weight`.
3. **Shots on target:** If SoT total > 0, add `min(1, (sot_home + sot_away) / 20) * shots_on_target_weight`.
4. **Home advantage:** Add `home_advantage_weight * 0.5`.
5. **Lineup:** If lineup/formation is known, add `lineup_weight`; otherwise 0.
6. **Key man:** If away has key absence and home does not, add `key_man_weight`. If home has key absence, subtract `key_man_weight`.
7. Clamp final score to **[0, 1]**.

When asked for exactly N games, **sort fixtures by this composite score descending** and return the top N (subject to mandatory filters and no-bet zone).
