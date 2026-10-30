# Base models, simulation, and how to read the slate

The commandments in `docs/projections/COMMANDMENTS.md` govern this manual. The prediction comes first. Book prices stay in their own view.

This is the operating manual for the projection snapshot. It is a transparent baseline, not a validated predictive model. Sportsbook prices never enter the models or the sim.

Retrieved snapshots are not live feeds. The Friday card was retrieved at 2026-10-30 17:41 UTC (1:41 PM ET).

## Files

| File | What it is |
| --- | --- |
| `scripts/projection-math.mjs` | The formulas. |
| `scripts/projection-math.test.mjs` | Checks for the formulas, including a fixed sim seed. |
| `scripts/project-slate.mjs` | Pulls ESPN logs and FanDuel/DraftKings prices, then writes a report. |
| `scripts/book-prices.mjs` | FanDuel Ohio board. DraftKings is read from ESPN inside `project-slate.mjs`. |
| `scripts/public-consensus.mjs` | Covers handicapper counts and the ESPN Matchup Predictor. Separate from the models and the books. |
| `scripts/backtest-slate.mjs` | Walk-forward record on completed NFL, NBA, and NHL games. |
| `docs/projections/BACKTEST.md` | The latest backtest record. |
| `docs/projections/PREMADE-PARLAYS.md` | Where FanDuel and DraftKings premade parlays were looked up, and that the priced legs were not in the payload. |
| `scripts/book-access.mjs` | Pulls the FanDuel Ohio board and the DraftKings prop feeds. |
| `docs/projections/BOOK-ACCESS.md` | The latest access check and row counts. |
| `docs/projections/book-access.json` | The prices from that check. |
| `docs/projections/COMMANDMENTS.md` | The ten rules that govern every slate. |
| `docs/sports-projection-requirements.md` | Recovered requirements and what is still open. |
| `docs/projections/2026-10-30-today.md` | Friday, October 30 only: four models, sim, FanDuel, DraftKings. |
| `docs/projections/2026-10-30-slate.md` | All sports on the retrieved boards: NFL week, Friday and Saturday FBS and FCS, October 30 NBA and NHL, Premier League, MLS. Same models and sim. MLB had no upcoming game. |
| `docs/projections/sideline-all-sports-2026-10-30.xlsx` | The same all-sports snapshot in one spreadsheet: instructions, one row per game, the four models, the sim, FanDuel, DraftKings, and the game-log histories. |
| `docs/projections/sideline-games-2026-10-30.csv` | The Games sheet alone, one row per game, for any spreadsheet. |

## Run it

From the repo root:

```bash
node scripts/projection-math.test.mjs
node scripts/project-slate.mjs docs/projections/2026-10-30-today.md --date 2026-10-30
node scripts/project-slate.mjs docs/projections/YYYY-MM-DD-slate.md
python3 scripts/export-slate-workbook.py
```

The last command reads the all-sports markdown already on disk and writes `docs/projections/sideline-all-sports-2026-10-30.xlsx` and `docs/projections/sideline-games-2026-10-30.csv`. It needs Python 3 and openpyxl. It does not call ESPN, FanDuel, or DraftKings.

`--date` keeps games whose start falls on that calendar day in America/New_York. Omit it to keep every upcoming game on the source boards.

## Data the models use

Completed games only, from the current season on each team’s ESPN schedule.

- NFL and college football: 2026 regular season. Yardage comes from the ESPN box score.
- NBA and NHL: the 2026–27 season (ESPN season year 2027).
- Premier League and MLS: the 2026–27 league season. Scoring only.
- Other seasons and other season types are skipped and counted.

For a visitor, “venue” means that team’s road games. For the home team, “venue” means that team’s home games. Neutral-site history stays in the overall sample only.

Football definitions:

- Net passing yards: the box-score passing yards after sacks.
- Sack yards lost: parsed from the box-score text `sacks-yards`.
- Gross passing yards: net passing yards plus sack yards lost.
- Total offense: the box-score total. It is not the sum of a rushing median and a passing median.
- Check: rushing yards plus net passing yards should match total offense within 1 yard. Mismatches are counted on the game.

If a box score is missing, that game stays in the points sample and drops out of the yardage sample.

## The four base models

Each model produces an away figure and a home figure. They are not averaged into a fifth number.

Home margin = home figure minus away figure. Positive means the home team is higher.

Combined = away figure plus home figure.

1. Venue-matched mean. Average the team’s own venue games with the opponent’s venue allowance. This is the headline baseline in the score tables.
2. Overall mean. Same average, using all completed games instead of the venue slice.
3. Venue-matched median. Average the median of the team’s venue games with the median of the opponent’s venue allowance. If either median is missing, this model is missing. It does not fall back to the mean.
4. Last 3 games. The team’s last three completed games, any venue, averaged with the opponent’s last three games allowed.

If one side of a pair has no games, the model uses the side that exists and is marked incomplete. If both sides are empty, the model is missing.

A sample under 3 games is marked thin.

## Convergence and synergy

Convergence counts how many of the four models pick home, away, or a tie. A tie is a home margin within 0.05 of zero. Unavailable models do not vote. If every available model picks the same side, the result is that side. Otherwise it is a split. The margin range and total range are the max minus the min across the models. Convergence is not outside consensus, and the four models are not blended.

Synergy looks at one team at a time. Compare that team’s venue scoring rate with its overall scoring rate, and compare the opponent’s venue allowance with the opponent’s overall allowance.

- Both differences on the same side of zero: the inputs reinforce.
- The differences have opposite signs: the inputs diverge. The average is still shown, and the split is left visible.
- Both differences within 0.05: flat.
- Any rate missing: missing-input.

## The simulation

Two thousand draws. The random seed is `20261030` mixed with the ESPN game id, so the same logs always reproduce the same sim. The sim does not read a price while it is drawing scores.

One draw:

1. Pick one of the visitor’s road scoring games and one of the home team’s home games allowed. Average them. That is the visitor’s simulated score.
2. Pick one of the home team’s home scoring games and one of the visitor’s road games allowed. Average them. That is the home simulated score.
3. If either venue list is empty, the sim does not run.

Reported from those draws:

- Median away score and median home score.
- Share of draws the home team wins, the visitor wins, and the draws tie.
- Home-cover rate against the FanDuel home margin and against the DraftKings home margin. The home team covers when its margin is greater than the book’s home margin. An equal margin is a push.
- Over rate against each book’s total. The draw is an over when the sum of the two simulated scores is greater than the posted total.

If any of the four venue lists has fewer than 3 games, the sim is marked thin. Treat that frequency as unstable.

## Books

This pass uses FanDuel and DraftKings only. A price in the report is that book’s number and the American odds on it. Confirmed October 30, 2026: these two sources return the prices. Use them again. Keep Novig off unless it is asked for.

| Book | What is retrieved | What is missing |
| --- | --- | --- |
| FanDuel | Latest spread, moneyline, and total from the Ohio board for NFL, college football, NBA, and NHL. Both sides of the spread, both sides of the moneyline, and the over and the under. | Opening price. Premier League and MLS boards. Team totals. Player props. |
| DraftKings | Open and latest spread, moneyline, and total from the ESPN quote. Both sides of each. | The DraftKings website itself (access denied). Team totals. Player props. |

FanDuel Ohio board, public, no login:

`https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId={nfl|ncaaf|nba|nhl}&_ak=FhMFpcPWXMeyZxOx`

The event name is `Away @ Home`. The spread market is `MATCH_HANDICAP_(2-WAY)`. The home runner’s handicap is the home spread: negative means the home team is favored. The away runner has its own handicap and its own American price. The total market is `TOTAL_POINTS_(OVER/UNDER)`. The moneyline market is `MONEY_LINE`. Report the price on each side. The home price alone is only half of the number. This board sends no opening price.

DraftKings game lines and the main player over/unders come from `https://sportsbook-nash.draftkings.com/api/sportscontent/prepack/v1/leagues/{league}`. League ids are NFL `88808`, NBA `42648`, and NHL `42133`. Pass yards are category `1000` subcategory `9524`. Rush yards are `1001` / `9514`. Receiving yards are `1342` / `14114`. Points, rebounds, and assists are `12488`, `12492`, and `12495`. The ESPN scoreboard quote is still a DraftKings game line, with open and latest, when that quote is present. The DraftKings website itself is not the feed.

Home margin for a book = the number of points by which the home team is favored. FanDuel’s home handicap is stored on the home runner, so the margin is the handicap multiplied by −1. DraftKings’ ESPN `spread` is the same sign convention.

A price is ranked only when both books post the same number. The better price is the higher American odds. Different numbers are not ranked.

No-vig price, from a moneyline pair only:

- Plus odds: `100 / (odds + 100)`.
- Minus odds: `abs(odds) / (abs(odds) + 100)`.
- Divide each side by the sum of the two. The amount over 1.00 is the hold.

That price belongs to the book. It is not our win probability.

## Line value, edge, and refinement

Line value is a point comparison.

- Outside the method range: that book’s number is above every model or below every model. Call it a line-value candidate. It is a point gap, not a priced edge.
- Inside the method range: no line value. The quote sits among the models.
- Missing book or missing models: missing-input.

A priced edge is not labeled. The sim win frequency can be subtracted from a no-vig price and recorded as a price gap. That gap is not an edge. An edge would require a validated win probability and a verified price. This resampling sim has not been validated.

Do not fit a model to either book. Do not treat one retrieved snapshot as a closing line. A thin sample, diverging inputs, or a quote inside the method range means the gap is not stable.

Public consensus is a separate view. Covers supplies the handicapper count on each side. The ESPN Matchup Predictor supplies a public-model win chance. A missing row stays missing. Do not average the four models and call that average consensus, and do not blend the public count into the models or the book prices.

## Predicted slate

The report opens with the predicted slate. That table is the prediction, and it comes before the book prices.

| Column | What it is |
| --- | --- |
| Predicted score | Venue-matched mean, away then home. |
| Total | Those two figures added. |
| Models | The side when all four models agree, with the vote. A split stays a split and names the side with more votes. The four models are not averaged. |
| Sim | Median score from 2,000 draws, then the share of draws won by the leader. Thin means a venue slice has fewer than 3 games. The percentage is the share of the draws. |

Book prices stay in each game’s market section. A price is the book’s number. It is not the prediction.

## What each game block contains

1. Independent projection. The venue-matched mean, the other three models, convergence, synergy, and the sim. Football games also list rushing, gross passing, net passing, sack yards lost, and total offense, with overall, home, and away histories.
2. FanDuel and DraftKings prices. Open and latest where the source sent them, with a retrieval timestamp.
3. Comparison. Each model minus each book, line-value flags, no-vig prices, and the sim-versus-price note.
4. Props. Present and flagged. No player prop number is filled in from FanDuel or DraftKings. The player-stat inventory is still open.

History lines show sample size, mean, median, mode, high, and low. If no value repeats, the mode is “no repeated value.” If the sample is empty, the field says missing. Highs and lows describe the past. They are not a forecast bound. The mode is not the projection.

## Friday, October 30, 2026

Seventeen games. No NFL, Premier League, MLS, or MLB game starts on that date.

Friday-only numbers are in `docs/projections/2026-10-30-today.md`. Every sport on the retrieved boards, including the NFL week and Saturday football and soccer, is in `docs/projections/2026-10-30-slate.md`.
