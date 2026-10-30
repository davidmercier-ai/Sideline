# Sports projection requirements

This file records the requirements recovered so far. It is not a complete inventory of every previously discussed player-stat projection. Unrecovered requirements remain open. They are not canceled or excluded.

The status words below mean different things:

- **Requested:** the requirement is in this document.
- **Implemented:** the current snapshot calculates and shows the field.
- **Tested:** the math or the retrieval path was run.
- **Blocked:** the field was requested and the source used here does not provide it.
- **Open:** the exact request has not been recovered, so it is not marked done.

## 1. Sports and projected statistics

### 1.1 Football — NFL, FBS, and FCS

Project for each team:

- Points scored / projected final score.
- Rushing yards.
- Passing yards.
- Total offensive yards.

Project for each game:

- Combined points total.
- Scoring margin.
- Combined rushing yards.
- Combined passing yards.
- Combined total offensive yards.

Passing-yard definitions:

- Clearly distinguish gross passing yards from net passing yards.
- Show projected sack yards lost when available.
- Make the total-offense calculation explicit and consistent.
- Team and combined game figures must reconcile mathematically.

Football yardage must remain visible alongside projected scores, sides, moneylines, totals, and props. Market information must not replace the statistical projections.

**Status:** NFL, FBS, and FCS baselines are implemented from 2026 completed games when ESPN returns a scoreboard and box scores. Gross passing yards are net passing yards plus sack yards lost. Total offense is the box-score total, and rush + net pass is checked against it. Player props are not implemented.

### 1.2 Basketball — NBA

Project each team’s points, the combined total, and the margin. Show points scored, points allowed, and overall plus home/away splits.

**Status:** Implemented as the same venue-matched baseline when the scoreboard has games. Yardage does not apply.

### 1.3 Hockey — NHL

Project each team’s goals, the combined total, and the margin. Show goals scored, goals allowed, and overall plus home/away splits.

**Status:** Implemented as the same venue-matched baseline when the scoreboard has games.

### 1.4 Soccer — including Premier League and MLS

Project each team’s goals, the combined total, and the margin. Show goals scored, goals allowed, and overall plus home/away splits.

**Status:** Implemented for the Premier League and MLS scoreboards ESPN returned on the run. Other leagues are requested by the broader soccer line and are not all generated in the first snapshot.

### 1.5 Baseball — MLB

Project each team’s runs, the combined total, and the margin. Show runs scored, runs allowed, and overall plus home/away splits.

**Status:** Implemented when the scoreboard has an upcoming game. An empty scoreboard is reported as no games, not as a made-up series.

### 1.6 Player-stat requirements — open inventory

- Include a separate player-projection and player-prop layer.
- Recover and record the exact previously requested player statistics for every sport.
- Do not treat an unrecovered field as a field that was never requested.
- Do not label the specification complete until the player-stat inventory has been reconciled.
- Clearly distinguish requested coverage from implemented coverage.

**Status:** Open. Not complete.

Observed product fields already displayed elsewhere in Sideline, which are not this projection inventory:

- MLB: probable-pitcher ERA, innings, games started; batting AB/H/RBI; pitching IP/K/ER.
- Soccer: scorers, penalties, own goals.
- NBA: three-point makes and attempts.
- NHL: scorers, goalie saves, shots against, save percentage.

Those displays are not projections and do not close this section.

## 2. Historical statistics behind the projections

### 2.1 For / against

For every applicable team statistic, show production for and production against.

- Football: points and offensive yardage.
- Basketball: points.
- Hockey: goals.
- Soccer: goals.
- Baseball: runs.

**Status:** Implemented from completed games in the team schedule. Football yardage comes from box scores. A game with no box score stays in the scoring sample and is flagged out of the yardage sample.

### 2.2 Overall, home, and away

Show overall, home, and away. The headline projection is the venue-matched pair:

- Visitor’s away production versus the home team’s home allowance.
- Home team’s home production versus the visitor’s away allowance.

The overall comparison is shown beside that and is not swapped in when both venue samples exist.

**Status:** Implemented. Neutral-site history is kept in the overall sample only. A split with one side missing is labeled incomplete.

### 2.3 Distribution statistics

Show games in the sample, mean, median, mode, high, and low.

- Explicitly established for football yardage.
- Intended for scoring statistics as well.
- Missing game-level histories must be flagged.
- Do not manufacture medians, modes, highs, or lows from aggregate averages.
- Do not silently remove unavailable fields.

**Status:** Implemented from the games actually retrieved. If every value is unique, the mode is reported as “no repeated value,” not replaced with the mean. An empty sample is “missing game-level history (n=0).”

### 2.4 Football historical yardage

Show overall, home, and away for rushing, gross passing, net passing, and total offense, both gained and allowed, plus sack yards lost when the box score prints sacks-yards lost.

**Status:** Implemented when the box score has the field. Sack yards lost are read from the `sacksYardsLost` display (`sacks-yards`). If that display does not parse, gross passing yards for that game are missing.

### 2.5 Data and presentation rules

- Separate historical results from forward projections.
- Show sample size.
- Identify the source and update time.
- Label missing, incomplete, or incompatible inputs.
- Historical highs and lows are descriptive, not forecast boundaries.
- Historical mode is not the projected outcome.
- Total-yardage distributions use game totals, not the sum of component medians.
- The baseline is labeled as a baseline, not a validated model.

**Status:** Implemented in the snapshot text.

## 3. Betting outputs

### 3.1 Sides

Show the projected margin, the sportsbook spread, the numeric difference, and the price with retrieval time.

**Status:** Implemented for the one book in the ESPN payload. Difference is baseline home margin minus market home margin. It is not called an edge.

### 3.2 Moneyline

Show the projected outcome and the sportsbook moneyline separately. Do not manufacture a win probability from the projected score.

**Status:** Implemented. Win probability is explicitly not calculated.

### 3.3 Game totals

Show the projected combined total, the sportsbook total, the difference, and the direction of that difference.

**Status:** Implemented. Direction is “baseline is above/below/equal to the posted total.”

### 3.4 Team totals

Show each team’s projection and the sportsbook team total when available.

**Status:** Team projection is implemented. The sportsbook team total is blocked: the ESPN team-odds object does not include one.

### 3.5 Player props

Keep a separate section. Do not invent lines.

**Status:** Section is present and empty. Inventory remains open.

### 3.6 Default sportsbooks

Compare FanDuel, DraftKings, and Novig, with Ohio availability in mind. Show open and latest prices, the best verified price, retrieval time, and public splits when available. Never call a snapshot a live feed.

**Status:** DraftKings open and close prices are implemented when ESPN sends them. FanDuel, Novig, Ohio confirmation, cross-book best price, and public splits are blocked for this source.

### 3.7 Three layers

- Layer A: independent baseline.
- Layer B: posted market, book, and retrieval time.
- Layer C: numeric difference only.

Outside-pick consensus is its own layer and is not blended in.

**Status:** Every game on the slate, in every sport, is presented as three views. Sides, moneyline, O/U, team totals, and props each have a row. Opening and latest prices and the retrieval timestamp sit only in the market view. The comparison shows each method minus the DraftKings number. Line value is marked only when that quote sits outside every method’s range. A point gap is not a priced edge. A priced edge stays unsupported until a validated win probability exists alongside a verified price. FanDuel and Novig remain unavailable, so there is no cross-book value check.

The independent view now has four reads of the same logs: venue-matched mean, overall mean, the average of the two venue medians, and the last three completed games. Agreement among those reads is convergence. It is counted, not averaged into a new projection. Synergy says whether a team’s own venue rate and the opponent’s venue allowance sit on the same side of their overall rates. Outside-pick consensus stays unavailable until a separate source is retrieved. It is not the average of these methods.

### 3.8 Output integrity

A projection difference is not a betting edge. Missing data is flagged. This report is not complete while the gaps above remain.

## Method

Headline number for a team statistic:

1. Take the venue-matched games (away games for the visitor, home games for the home team).
2. Average that team’s own production with the opponent’s venue-matched allowance.
3. If one of those samples is empty, use the one that exists and mark the projection incomplete.
4. If both are empty, leave the projection missing.
5. Add the two team projections for a combined total. Subtract them for the home margin.

Total offense is not rebuilt by adding a rushing median to a passing median.

## How to regenerate

```bash
node scripts/projection-math.test.mjs
node scripts/project-slate.mjs docs/projections/2026-10-30-slate.md
```
