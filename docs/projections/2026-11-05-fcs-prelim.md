# Slate for 2026-11-05

Retrieved 2026-11-02T00:29:03.937Z (UTC). This is one retrieved snapshot, not a live feed.
Included games start on 2026-11-05 in America/New_York. Other dates on the source boards are left out.

The commandments in docs/projections/COMMANDMENTS.md govern this slate. The predicted slate is the first table. That score is the venue-matched mean. Each game then has an independent projection, sportsbook lines and prices, a comparison, and the game log against the posted number. Sides, moneyline, O/U, team totals, and props are on every sport, not only football. An edge is stated only when a validated probability and verified prices support it. This snapshot does not meet that bar.

Status: not complete. This pass compares projections with FanDuel and DraftKings only. DraftKings open and latest come from ESPN. FanDuel latest comes from the Ohio board for NFL, college football, NBA, and NHL. Player props and team totals were not on those two feeds.

## Open gaps in this snapshot

- Player-stat projection inventory: open. Not recovered, not treated as canceled.
- Player props: FanDuel and DraftKings game-line feeds did not include a verified player prop. The inventory stays open.
- FanDuel opening prices: not on the Ohio board.
- DraftKings direct site: access denied. Open and latest prices are the ESPN quote.
- FanDuel soccer: no public Ohio board for Premier League or MLS, so those games have DraftKings only.
- Team totals: unavailable at both FanDuel and DraftKings on these feeds.
- Model win probability: not calculated. A score is not turned into a probability.
- Priced edge: not labeled. A resampling sim is reported separately from the four base models, and a gap versus the no-vig price is not called an edge.
- Public consensus: Covers handicapper picks and the ESPN Matchup Predictor when those sources send a row. A missing row stays missing. This is not blended into the four models or the book prices.

Price sources loaded at 2026-11-02T00:29:03.937Z UTC. FanDuel Ohio games indexed: nfl 18, ncaaf 63, nba 25, nhl 5. DraftKings is read per game from ESPN.
Price source notes: FanDuel epl: no public Ohio board for this league | FanDuel mls: no public Ohio board for this league

Public consensus loaded at 2026-11-02T00:29:03.937Z UTC. Covers handicapper rows: 68.

## Predicted slate

This is the prediction. The score is the venue-matched mean. The four models are not averaged. The sim is a separate 2,000-draw read. A sim percentage is the share of the draws. Thin means a venue slice has fewer than 3 games. Book prices are in each game’s market section.

| Time | Game | Predicted score | Total | Models | Sim |
| --- | --- | --- | --- | --- | --- |
| 11/5 - 7:30 PM EST | SC State at Howard | 28.9–25.1 | 54 | SC State, 4–0 | 28–24, SC State 62.4%, thin |

## FCS 2026-11-05

Games on this retrieved board: 1.

Alerts. The color is the log rating. The emoji after it is why. A player prop names both teams and the kickoff on this same line.

| Alert |
| --- |
| 🏈 🟡 2 📏 Lean. Thin sample. Game: SC State at Howard, 11/5 - 7:30 PM EST. |

Comparison summary. Prices and timestamps are in each game’s market section, not here.

| Game | Baseline score | Home margin | Market home margin | Margin difference | Baseline total | Posted total | Total difference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SC State at Howard | 28.9–25.1 | -3.7 | missing | missing | 54 | missing | missing |

Agreement among the four statistical methods. This is not outside consensus, and it is not a blend.

| Game | Home votes | Away votes | Tie votes | Agreement | Margin range | Total range |
| --- | --- | --- | --- | --- | --- | --- |
| SC State at Howard | 0 | 4 | 0 | away | 15 | 3 |

Line value against FanDuel and DraftKings. A candidate means that book sits outside every method. That is a point gap, not a priced edge.

| Game | FanDuel side | DraftKings side | FanDuel total | DraftKings total |
| --- | --- | --- | --- | --- |
| SC State at Howard | missing-input | missing-input | missing-input | missing-input |

Public consensus. Handicapper picks are the Covers count. The ESPN figure is a public-model win chance. Neither is one of the four models, and neither is a book price.

| Game | Covers consensus | Covers picks | ESPN Matchup Predictor |
| --- | --- | --- | --- |
| SC State at Howard | unavailable | unavailable | unavailable |

### SC State at Howard

- When: 11/5 - 7:30 PM EST
- Site: home team listed second
- Alert: 🏈 🟡 2 📏 Lean. Thin sample. Game: SC State at Howard, 11/5 - 7:30 PM EST.

**1. Independent projection**

Statistical source: ESPN team schedules for 2026 and 2026. Football yardage adds ESPN box scores. No sportsbook price, open line, or quote timestamp enters this calculation.
Sample filter: current season on each team schedule. Other seasons skipped: away 0, home 0. Other season types skipped: away 0, home 0.
Method: venue-matched mean. Visiting production uses the visitor’s away games. Home production uses the home team’s home games. The opponent input is that team’s matching venue allowance. Overall means are shown beside that and are not substituted when both venue samples exist. This is a transparent baseline, not a validated model.

- SC State points: 28.9 (venue-matched means; for n=4, against n=2; thin sample (n<3))
- Howard points: 25.1 (venue-matched means; for n=2, against n=4; thin sample (n<3))
- Combined points: 54
- Home margin: -3.7 (positive means the home team is projected higher)
- Projected outcome: SC State
- Overall comparison, SC State: 36.2 (overall means; for n=9, against n=9)
- Overall comparison, Howard: 17.4 (overall means; for n=9, against n=9)

Four independent reads of the same logs. They are listed separately and are not averaged into a single projection.

| Method | Away | Home | Home margin | Combined |
| --- | --- | --- | --- | --- |
| Venue-matched mean | 28.9 | 25.1 | -3.7 | 54 |
| Overall mean | 36.2 | 17.4 | -18.7 | 53.6 |
| Venue-matched median | 28.8 | 22.5 | -6.2 | 51.3 |
| Last 3 games | 30.5 | 20.5 | -10 | 51 |

- Convergence: 4 methods available; home 0, away 4, tie 0. Result: away.
- Margin range across methods: 15. Combined range across methods: 3.
- Convergence is agreement among these methods. It is not outside consensus.
- Synergy, visitor scoring inputs: reinforce (own venue vs overall -6.7; opponent allowance vs overall -7.8).
- Synergy, home scoring inputs: reinforce (own venue vs overall 7.9; opponent allowance vs overall 7.5).
- Synergy means the team’s own venue rate and the opponent’s venue allowance sit on the same side of their overall rates. A diverging pair is left visible. The two rates are not collapsed.
- Outside consensus: recorded in its own section. These four methods are not that consensus, and they are not averaged.

**Simulation**

Each draw takes one completed venue game from the team and one from the opponent, then averages those two results. Two thousand draws. The seed is fixed, so the same logs reproduce the same sim. The sim does not use a sportsbook price.
- Sim median score: SC State 28, Howard 24.
- Sim frequencies: Howard wins 34%, SC State wins 62.4%, ties 3.7%.
- Sim sample: thin. At least one venue slice has fewer than 3 games, so this frequency is not a stable probability.
- Priced edge: not supported. The sim frequency is not a validated win probability.
- SC State rushing yards: 121.1 (venue-matched means; for n=4, against n=2; thin sample (n<3))
- Howard rushing yards: 115.4 (venue-matched means; for n=2, against n=4; thin sample (n<3))
- Combined rushing yards: 236.5
- Overall comparison, SC State rushing yards: 175.1 (overall means; for n=9, against n=9)
- Overall comparison, Howard rushing yards: 99.7 (overall means; for n=9, against n=9)
- SC State gross passing yards (net passing yards + sack yards lost): missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- Howard gross passing yards (net passing yards + sack yards lost): missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- Combined gross passing yards (net passing yards + sack yards lost): missing
- Overall comparison, SC State gross passing yards (net passing yards + sack yards lost): missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- Overall comparison, Howard gross passing yards (net passing yards + sack yards lost): missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- SC State net passing yards: 237.5 (venue-matched means; for n=4, against n=2; thin sample (n<3))
- Howard net passing yards: 153.1 (venue-matched means; for n=2, against n=4; thin sample (n<3))
- Combined net passing yards: 390.6
- Overall comparison, SC State net passing yards: 239 (overall means; for n=9, against n=9)
- Overall comparison, Howard net passing yards: 142.5 (overall means; for n=9, against n=9)
- SC State sack yards lost: missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- Howard sack yards lost: missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- Combined sack yards lost: missing
- Overall comparison, SC State sack yards lost: missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- Overall comparison, Howard sack yards lost: missing (missing; for n=0, against n=0; incomplete input; thin sample (n<3))
- SC State total offensive yards (box-score total, not a sum of medians): 358.6 (venue-matched means; for n=4, against n=2; thin sample (n<3))
- Howard total offensive yards (box-score total, not a sum of medians): 268.5 (venue-matched means; for n=2, against n=4; thin sample (n<3))
- Combined total offensive yards (box-score total, not a sum of medians): 627.1
- Overall comparison, SC State total offensive yards (box-score total, not a sum of medians): 414.1 (overall means; for n=9, against n=9)
- Overall comparison, Howard total offensive yards (box-score total, not a sum of medians): 242.2 (overall means; for n=9, against n=9)
- Total-offense identity: rush + net pass checked on 18 team-games; 0 did not match the box-score total within 1 yard.

**Historical for / against**

- SC State points for, overall: n=9, mean 42, median 31, mode 31, high 87, low 20
- SC State points for, home: n=4, mean 51.5, median 48.5, mode no repeated value, high 87, low 22
- SC State points for, away: n=4, mean 35.3, median 35, mode no repeated value, high 51, low 20
- SC State points against, overall: n=9, mean 16.8, median 13, mode 0, high 49, low 0
- SC State points against, home: n=4, mean 10.3, median 3.5, mode 0, high 34, low 0
- SC State points against, away: n=4, mean 24.3, median 19, mode no repeated value, high 49, low 10
- Howard points for, overall: n=9, mean 18.1, median 21, mode 0 or 31, high 31, low 0
- Howard points for, home: n=2, mean 26, median 26, mode no repeated value, high 31, low 21
- Howard points for, away: n=5, mean 10.6, median 7, mode 0, high 26, low 0
- Howard points against, overall: n=9, mean 30.3, median 24, mode 24, high 58, low 13
- Howard points against, home: n=2, mean 22.5, median 22.5, mode no repeated value, high 28, low 17
- Howard points against, away: n=5, mean 38.2, median 34, mode no repeated value, high 58, low 20
- SC State rushing yards gained, overall: n=9, mean 212.8, median 213, mode 282, high 423, low 91
- SC State rushing yards gained, home: n=4, mean 225.5, median 194, mode no repeated value, high 423, low 91
- SC State rushing yards gained, away: n=4, mean 180.3, median 168.5, mode no repeated value, high 282, low 102
- Howard rushing yards gained, overall: n=9, mean 117.2, median 120, mode no repeated value, high 201, low 13
- Howard rushing yards gained, home: n=2, mean 166, median 166, mode no repeated value, high 201, low 131
- Howard rushing yards gained, away: n=5, mean 97.8, median 107, mode no repeated value, high 166, low 13
- SC State rushing yards allowed, overall: n=9, mean 82.2, median 75, mode no repeated value, high 235, low -12
- SC State rushing yards allowed, home: n=4, mean 120.5, median 96, mode no repeated value, high 235, low 55
- SC State rushing yards allowed, away: n=4, mean 64.8, median 80, mode no repeated value, high 111, low -12
- Howard rushing yards allowed, overall: n=9, mean 137.4, median 99, mode no repeated value, high 296, low 36
- Howard rushing yards allowed, home: n=2, mean 62, median 62, mode no repeated value, high 85, low 39
- Howard rushing yards allowed, away: n=5, mean 185.2, median 195, mode no repeated value, high 296, low 70
- SC State gross passing yards gained, overall: missing game-level history (n=0)
- SC State gross passing yards gained, home: missing game-level history (n=0)
- SC State gross passing yards gained, away: missing game-level history (n=0)
- Howard gross passing yards gained, overall: missing game-level history (n=0)
- Howard gross passing yards gained, home: missing game-level history (n=0)
- Howard gross passing yards gained, away: missing game-level history (n=0)
- SC State gross passing yards allowed, overall: missing game-level history (n=0)
- SC State gross passing yards allowed, home: missing game-level history (n=0)
- SC State gross passing yards allowed, away: missing game-level history (n=0)
- Howard gross passing yards allowed, overall: missing game-level history (n=0)
- Howard gross passing yards allowed, home: missing game-level history (n=0)
- Howard gross passing yards allowed, away: missing game-level history (n=0)
- SC State net passing yards gained, overall: n=9, mean 235.9, median 215, mode no repeated value, high 368, low 148
- SC State net passing yards gained, home: n=4, mean 229, median 228.5, mode no repeated value, high 255, low 204
- SC State net passing yards gained, away: n=4, mean 255, median 252, mode no repeated value, high 368, low 148
- Howard net passing yards gained, overall: n=9, mean 131.7, median 109, mode 44, high 322, low 44
- Howard net passing yards gained, home: n=2, mean 118.5, median 118.5, mode no repeated value, high 128, low 109
- Howard net passing yards gained, away: n=5, mean 71.8, median 51, mode 44, high 140, low 44
- SC State net passing yards allowed, overall: n=9, mean 153.3, median 162, mode 162, high 264, low 42
- SC State net passing yards allowed, home: n=4, mean 116.8, median 110.5, mode no repeated value, high 204, low 42
- SC State net passing yards allowed, away: n=4, mean 187.8, median 178, mode no repeated value, high 264, low 131
- Howard net passing yards allowed, overall: n=9, mean 242.1, median 254, mode no repeated value, high 295, low 179
- Howard net passing yards allowed, home: n=2, mean 220, median 220, mode no repeated value, high 261, low 179
- Howard net passing yards allowed, away: n=5, mean 248.8, median 268, mode no repeated value, high 295, low 195
- SC State sack yards lost, overall: missing game-level history (n=0)
- SC State sack yards lost, home: missing game-level history (n=0)
- SC State sack yards lost, away: missing game-level history (n=0)
- Howard sack yards lost, overall: missing game-level history (n=0)
- Howard sack yards lost, home: missing game-level history (n=0)
- Howard sack yards lost, away: missing game-level history (n=0)
- SC State total offensive yards gained, overall: n=9, mean 448.7, median 470, mode no repeated value, high 627, low 321
- SC State total offensive yards gained, home: n=4, mean 454.5, median 435, mode no repeated value, high 627, low 321
- SC State total offensive yards gained, away: n=4, mean 435.3, median 450, mode no repeated value, high 509, low 332
- Howard total offensive yards gained, overall: n=9, mean 248.9, median 246, mode no repeated value, high 436, low 57
- Howard total offensive yards gained, home: n=2, mean 284.5, median 284.5, mode no repeated value, high 329, low 240
- Howard total offensive yards gained, away: n=5, mean 169.6, median 184, mode no repeated value, high 247, low 57
- SC State total offensive yards allowed, overall: n=9, mean 235.6, median 238, mode no repeated value, high 439, low 114
- SC State total offensive yards allowed, home: n=4, mean 237.3, median 198, mode no repeated value, high 439, low 114
- SC State total offensive yards allowed, away: n=4, mean 252.5, median 271.5, mode no repeated value, high 317, low 150
- Howard total offensive yards allowed, overall: n=9, mean 379.6, median 365, mode no repeated value, high 534, low 264
- Howard total offensive yards allowed, home: n=2, mean 282, median 282, mode no repeated value, high 300, low 264
- Howard total offensive yards allowed, away: n=5, mean 434, median 472, mode no repeated value, high 534, low 294

**2. Sportsbook lines and prices — FanDuel and DraftKings**

Retrieved 2026-11-02T00:29:03.937Z UTC. Snapshot, not a live feed. This pass uses FanDuel and DraftKings only.
DraftKings open and latest come from the ESPN quote. The DraftKings site returned access denied. FanDuel latest comes from the Ohio board. FanDuel did not send an opening price.
Prices and timestamps stay in this section. They are not inputs to the projection above.

| Market | FanDuel open | FanDuel latest | DraftKings open | DraftKings latest | Flag |
| --- | --- | --- | --- | --- | --- |
| Side | unavailable | unavailable | unavailable | unavailable | FD unavailable; DK unavailable |
| Moneyline | unavailable | unavailable | SCST unavailable / HOW unavailable | SCST unavailable / HOW unavailable | FD unavailable; DK unavailable |
| O/U | unavailable | unavailable | unavailable / unavailable | unavailable / unavailable | FD unavailable; DK unavailable |
| Team total, away | unavailable | unavailable | unavailable | unavailable | FD unavailable; DK unavailable |
| Team total, home | unavailable | unavailable | unavailable | unavailable | FD unavailable; DK unavailable |
- DraftKings: no sportsbook quote in the ESPN scoreboard payload
- FanDuel: no matching Ohio board game.

**3. Comparison — value, edge, and refinement**

Each method is subtracted from FanDuel and from DraftKings on its own. The methods are not averaged first. Prices are not written back into the projection.

| Method | Home margin | Minus FanDuel | Minus DraftKings | Combined | Minus FanDuel total | Minus DraftKings total |
| --- | --- | --- | --- | --- | --- | --- |
| Venue-matched mean | -3.7 | missing | missing | 54 | missing | missing |
| Overall mean | -18.7 | missing | missing | 53.6 | missing | missing |
| Venue-matched median | -6.2 | missing | missing | 51.3 | missing | missing |
| Last 3 games | -10 | missing | missing | 51 | missing | missing |
| DraftKings latest | missing | — | missing | — |
| FanDuel latest | missing | — | missing | — |

- Venue-mean side gap versus FanDuel: missing. Versus DraftKings: missing.
- Venue-mean total gap versus FanDuel: missing (unavailable). Versus DraftKings: missing (unavailable).
- DraftKings side: DraftKings: missing-input
- DraftKings total: DraftKings: missing-input
- FanDuel side: FanDuel: missing-input
- FanDuel total: FanDuel: missing-input
- Team totals: unavailable at FanDuel and DraftKings on the feeds used here.
- FanDuel versus DraftKings: one of the two home spreads is missing.
- DraftKings no-vig price: missing-input.
- FanDuel no-vig price: missing-input.
- Our win probability: not calculated. A projected score is not a probability.
- Priced edge: not supported. A point gap against FanDuel or DraftKings is line value only. An edge still needs a validated win probability.
- System refinement: compare the two books only when the number matches; do not fit the baseline to either posted number; treat a quote inside the method range as no separation from the market.
- Outside-pick consensus: recorded in the public-consensus section. Not used as a tie-break.

**4. Public consensus — handicappers, sports media, and public models**

This view is not one of the four models and it is not a sportsbook price. It is not averaged, and it is not used as a tie-break.

- Covers handicapper consensus: unavailable. No matching row on the Covers overall board.
- ESPN Matchup Predictor: unavailable.
- A source that did not send a machine-readable pick stays missing. No pick is invented.

**5. Game log against the posted number**

The four models compress these games into means. This step lists each completed game and counts the matching slice against the posted number. The matching slice is the visitor’s away games and the home team’s home games. On a neutral site the matching slice is every completed game, because the home/away split is the wrong site. A home margin covers when it is greater than the book’s home margin. An away margin covers when it is greater than the negative of that number. An equal margin is a push. The count is not a model and not an edge.

**SC State** — matching slice: away

| Date | Site | Opponent | Score | Margin | Combined | Matching slice |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-08-29 | home | SAV | 87-0 | +87 | 87 | no |
| 2026-09-06 | neutral | FAMU | 31-13 | +18 | 44 | no |
| 2026-09-12 | home | VIR | 66-0 | +66 | 66 | no |
| 2026-09-19 | away | FUR | 20-17 | +3 | 37 | yes |
| 2026-09-26 | away | BCU | 31-21 | +10 | 52 | yes |
| 2026-10-03 | home | CIT | 31-34 | -3 | 65 | no |
| 2026-10-10 | away | CHSO | 39-49 | -10 | 88 | yes |
| 2026-10-24 | home | NORF | 22-7 | +15 | 29 | no |
| 2026-10-29 | away | MORG | 51-10 | +41 | 61 | yes |

**Howard** — matching slice: home

| Date | Site | Opponent | Score | Margin | Combined | Matching slice |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-08-29 | neutral | AAMU | 31-24 | +7 | 55 | no |
| 2026-09-05 | home | RICH | 21-28 | -7 | 49 | yes |
| 2026-09-12 | away | IU | 0-55 | -55 | 55 | no |
| 2026-09-25 | away | RUTG | 7-58 | -51 | 65 | no |
| 2026-10-03 | neutral | HAMP | 27-13 | +14 | 40 | no |
| 2026-10-10 | away | PENN | 20-24 | -4 | 44 | no |
| 2026-10-17 | home | MOR | 31-17 | +14 | 48 | yes |
| 2026-10-24 | away | MORG | 26-20 | +6 | 46 | no |
| 2026-10-31 | away | NCCU | 0-34 | -34 | 34 | no |

- DraftKings spread. SC State away: missing, so no count. Howard home: missing, so no count.
- DraftKings total. SC State away: missing, so no count. Howard home: missing, so no count.
- FanDuel spread. SC State away: missing, so no count. Howard home: missing, so no count.
- FanDuel total. SC State away: missing, so no count. Howard home: missing, so no count.

**Props**

Separate from the team card. This pass looks for FanDuel and DraftKings props only. Neither game-line feed included a verified player prop.

| Prop | Independent projection | FanDuel | DraftKings | Flag |
| --- | --- | --- | --- | --- |
| Player props for SC State at Howard | inventory open | unavailable | unavailable | inventory-open; missing-input; unavailable |

## Player props

This section is separate from the team cards. Every game above also has its own props block.

| Check | Status | Flag |
| --- | --- | --- |
| Exact player-stat inventory | Not recovered | inventory-open |
| Independent player projection | Not calculated | missing-input |
| FanDuel player props | Not on the Ohio game-line board | unavailable |
| DraftKings player props | Not on the ESPN quote | unavailable |
| Verification | No prop line was checked against a book | unverified |

No prop number is invented. Unrecovered player stats stay open.

