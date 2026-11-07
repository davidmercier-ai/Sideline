# Walk-forward backtest

Run at 2026-11-07T15:41:48.816Z UTC. Each game uses only that team's completed games from earlier in the same season. The game being scored is not in its own sample.

This is a record of the venue-matched mean, the four-model vote, and the 2,000-draw sim. It is not a priced edge. A straight-up hit means the side with the higher number won. A cover means the venue-matched margin and the actual margin sat on the same side of the DraftKings spread. Pushes are left out of the rates.

| League | Games scored | Venue side | Unanimous side | Stable sim side | Always home | Venue cover | Margin error | Total error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFL | 98 of 122 | 55.7% (54/97) | 59.0% (36/61) | 46.2% (6/13) | 49.5% | 52.2% (48/92) | 11.0 | 14.0 |
| NCAAF | 1766 of 2197 | 63.6% (1124/1766) | 73.0% (829/1136) | 71.4% (147/206) | 56.6% | 49.7% (383/770) | 20.6 | 15.2 |
| NBA | 109 of 132 | 60.6% (66/109) | 66.2% (49/74) | 54.8% (17/31) | 50.5% | 51.4% (56/109) | 14.1 | 16.1 |
| NHL | 248 of 264 | 52.0% (129/248) | 51.5% (53/103) | 58.3% (88/151) | 57.3% | 57.6% (140/243) | 2.4 | 2.0 |
| NCAAB | 118 of 374 | 84.7% (100/118) | 85.0% (85/100) | missing (0/0) | 88.1% | 47.8% (44/92) | 19.1 | 18.2 |
| EPL | 72 of 92 | 51.0% (26/51) | 60.0% (15/25) | 53.8% (14/26) | 54.9% | 52.2% (35/67) | 1.5 | 1.5 |
| MLS | 475 of 495 | 59.3% (207/349) | 70.1% (94/134) | 60.9% (171/281) | 60.5% | 47.6% (214/450) | 1.4 | 1.5 |

Games with no prior venue sample are not scored. The stable sim side skips a game when any venue list has fewer than 3 games. Always home is the rate at which the home team won the decided games, shown so the model rates have a simple comparison. NCAAB uses the 2026-27 season only. Its venue side is below always home, so a college side stays a lean.

The cover column uses the DraftKings number on the completed-game summary. That is not a line saved before tip. Pregame spreads are stored apart and are not used in this column until one is older than the game. A game with no DraftKings spread stays out of the cover rate.

## Sim frequency

When the sim’s home-win frequency falls in a bucket, this is how often the home team won. A calibrated sim lands near the bucket. A gap versus a no-vig price stays unlabeled until this table is close to the bucket.

| League | Under 50% | 50 to 60% | 60 to 70% | 70 to 80% | 80% or more |
| --- | --- | --- | --- | --- | --- |
| NFL | 41.2% (14/34) | 27.3% (3/11) | 50.0% (2/4) | 80.0% (8/10) | 60.0% (12/20) |
| NCAAF | 33.5% (128/382) | 52.3% (46/88) | 63.4% (45/71) | 58.4% (66/113) | 69.0% (430/623) |
| NBA | 40.0% (18/45) | 66.7% (6/9) | 33.3% (1/3) | 62.5% (5/8) | 66.7% (20/30) |
| NHL | 49.1% (54/110) | 51.6% (16/31) | 74.2% (23/31) | 58.3% (7/12) | 68.8% (22/32) |
| NCAAB | 0.0% (0/1) | 0/0 | 0/0 | 0/0 | 93.5% (43/46) |
| EPL | 50.0% (12/24) | 40.0% (2/5) | 57.1% (4/7) | 80.0% (4/5) | 60.0% (6/10) |
| MLS | 55.3% (52/94) | 56.9% (41/72) | 64.5% (40/62) | 70.5% (31/44) | 62.9% (39/62) |

## Board rule

A board side needs four finite reads on the same side of the spread, each at least the room past that number, and every venue list at 3 games or more. The room is 1 point in football and basketball and 0.25 goals in hockey and soccer. A board total is the same test against the posted total. A hit means the game finished on that side. A push is left out. This is a record of the filter, not a priced edge.

| League | Board sides | Side covers | Board totals | Total hits |
| --- | --- | --- | --- | --- |
| NFL | 0 | 0/0 | 3 | 0.0% (0/3) |
| NCAAF | 6 | 50.0% (3/6) | 18 | 44.4% (8/18) |
| NBA | 5 | 20.0% (1/5) | 10 | 40.0% (4/10) |
| NHL | 8 | 62.5% (5/8) | 44 | 47.7% (21/44) |
| NCAAB | 0 | 0/0 | 0 | 0/0 |
| EPL | 3 | 33.3% (1/3) | 6 | 50.0% (3/6) |
| MLS | 11 | 90.9% (10/11) | 116 | 62.1% (72/116) |

## Favorite and dog covers

The venue-mean cover, split by whether that pick was the favorite or the dog. A negative home spread means the home team was favored. A pick'em is left out. Dog covered, any pick is how often the dog covered with no model involved, so the dog-pick column has a baseline.

| League | Favorite picks | Dog picks | Dog covered, any pick |
| --- | --- | --- | --- |
| NFL | 43.8% (21/48) | 61.4% (27/44) | 57.9% (55/95) |
| NCAAF | 47.9% (161/336) | 51.2% (222/434) | 51.7% (401/775) |
| NBA | 54.9% (28/51) | 48.3% (28/58) | 46.8% (51/109) |
| NHL | 40.0% (16/40) | 61.1% (124/203) | 60.9% (151/248) |
| NCAAB | 53.1% (26/49) | 41.9% (18/43) | 44.6% (41/92) |
| EPL | 39.1% (9/23) | 59.1% (26/44) | 59.7% (43/72) |
| MLS | 43.9% (75/171) | 49.8% (139/279) | 53.7% (255/475) |

## Short of the number, favorite and dog

Unanimous sides whose closest read is short of the spread, split by favorite and dog. Every favorite is the straight-up win rate of the favorite in the same walk-forward, with no model involved. A pick'em is left out. This side is not a bet.

| League | Short, favorite | Every favorite | Short, dog |
| --- | --- | --- | --- |
| NFL | 62.5% (20/32) | 61.9% (60/97) | 0/0 |
| NCAAF | 84.9% (236/278) | 74.5% (585/785) | 0/0 |
| NBA | 76.3% (29/38) | 70.6% (77/109) | 0/0 |
| NHL | 58.3% (42/72) | 63.3% (157/248) | 0/0 |
| NCAAB | 97.1% (33/34) | 89.1% (82/92) | 0/0 |
| EPL | 81.8% (9/11) | 64.7% (33/51) | 0/0 |
| MLS | 73.5% (72/98) | 67.6% (236/349) | 0/0 |

NFL: the short-of-the-number favorites are within 5 points of every favorite. The cut is finished. It is not a bet.
NCAAF: the short-of-the-number favorites beat every favorite by more than 5 points. The later sample has no games yet, so open stays a note. It is not a bet.
NBA: the later sample still beats every favorite by more than 5 points. The gap stays on the record. It is not a bet.
NHL: the short-of-the-number favorites are within 5 points of every favorite. The cut is finished. It is not a bet.
NCAAB: the later sample still beats every favorite by more than 5 points. The gap stays on the record. It is not a bet.
EPL: the short-of-the-number favorites beat every favorite by more than 5 points. The later sample has no games yet, so open stays a note. It is not a bet.
MLS: the short-of-the-number favorites beat every favorite by more than 5 points. The later sample has no games yet, so open stays a note. It is not a bet.

## Where the short favorites sit

The short-of-the-number favorites, split by home or road and by the size of the spread. The unit is points in football and basketball and goals in hockey.

| League | Home favorite | Road favorite | Spread under 3 | 3 to 7 | 7 to 12 | 12 or more |
| --- | --- | --- | --- | --- | --- | --- |
| NFL | 63.6% (14/22) | 60.0% (6/10) | 50.0% (2/4) | 71.4% (10/14) | 58.3% (7/12) | 50.0% (1/2) |
| NCAAF | 85.3% (192/225) | 83.0% (44/53) | 100.0% (2/2) | 57.6% (19/33) | 76.7% (46/60) | 92.3% (169/183) |
| NBA | 77.3% (17/22) | 75.0% (12/16) | 0.0% (0/3) | 63.6% (7/11) | 83.3% (10/12) | 100.0% (12/12) |
| NHL | 74.4% (29/39) | 39.4% (13/33) | 58.3% (42/72) | 0/0 | 0/0 | 0/0 |
| NCAAB | 97.1% (33/34) | 0/0 | 0/0 | 0/0 | 0.0% (0/1) | 100.0% (33/33) |
| EPL | 71.4% (5/7) | 100.0% (4/4) | 81.8% (9/11) | 0/0 | 0/0 | 0/0 |
| MLS | 74.7% (62/83) | 66.7% (10/15) | 73.5% (72/98) | 0/0 | 0/0 | 0/0 |

Games after 2026-11-07T00:07:16.237Z are the confirming sample. The games that produced the gap are not in it. Until that sample has a count, open stays a note.

| League | Short favorites after the freeze | Every favorite after the freeze |
| --- | --- | --- |
| NFL | 0/0 | 0/0 |
| NCAAF | 0/0 | 75.0% (3/4) |
| NBA | 66.7% (2/3) | 85.7% (6/7) |
| NHL | 100.0% (1/1) | 50.0% (1/2) |
| NCAAB | 100.0% (11/11) | 92.9% (26/28) |
| EPL | 0/0 | 0.0% (0/1) |
| MLS | 0/0 | 0/0 |

## Scar and on the number

A scar is the venue reads on one side and the last available read on the other. On the number is a unanimous side whose closest read lands on the spread. Each is compared with every favorite in that league. A slice that does not beat every favorite is not a bet.

| League | Scar | On the number | Every favorite |
| --- | --- | --- | --- |
| NFL | 50.0% (1/2) | 0/0 | 61.9% (60/97) |
| NCAAF | 72.2% (13/18) | 0/0 | 74.5% (585/785) |
| NBA | 25.0% (1/4) | 0/0 | 70.6% (77/109) |
| NHL | 58.6% (17/29) | 0/0 | 63.3% (157/248) |
| NCAAB | 0/0 | 0/0 | 89.1% (82/92) |
| EPL | 50.0% (2/4) | 100.0% (1/1) | 64.7% (33/51) |
| MLS | 55.4% (31/56) | 0.0% (0/1) | 67.6% (236/349) |

## Public models

The ESPN Matchup Predictor is read from the completed-game predictor, when that source still has a win chance. The side is whoever the predictor scored higher. Covers is the current board only, so a Covers row counts only when a saved pick is older than the game. Neither is blended into the four reads.

| League | ESPN predictor |
| --- | --- |
| NFL | 60.8% (59/97) |
| NCAAF | 75.4% (367/487) |
| NBA | 68.8% (75/109) |
| NHL | 0/0 |
| NCAAB | 91.5% (108/118) |
| EPL | 0/0 |
| MLS | 0/0 |

## Opponent allowance

One read, kept out of the four and out of the alert. The away score is the home team’s home points allowed. The home score is the away team’s road points allowed. A side is counted only when both lists have at least 3 games. A hit is a straight-up win. This is not a priced edge.

| League | Allowance side |
| --- | --- |
| NFL | 46.2% (6/13) |
| NCAAF | 63.2% (129/204) |
| NBA | 48.4% (15/31) |
| NHL | 56.6% (82/145) |
| NCAAB | 0/0 |
| EPL | 54.2% (13/24) |
| MLS | 57.4% (155/270) |

## Unanimous side by gap to the spread

The unanimous side is every decided game where the finite reads picked the same winner. The gap is the closest of those reads to the spread, on that side. A negative gap means the closest read sat on the other side of the number. A hit is a straight-up win. The cuts are the league’s scoring unit: points in the NFL and NBA, goals in the NHL. A game with no spread stays out. This is not a priced edge.

| League | Short of the number | 0 to 1 | 1 to 5 | 5 to 10 | 10 or more |
| --- | --- | --- | --- | --- | --- |
| NFL | 62.5% (20/32) | 57.1% (4/7) | 46.2% (6/13) | 80.0% (4/5) | 50.0% (2/4) |
| NCAAF | 84.9% (236/278) | 41.7% (5/12) | 52.8% (28/53) | 65.0% (26/40) | 24.1% (13/54) |
| NBA | 76.3% (29/38) | 80.0% (4/5) | 60.0% (9/15) | 37.5% (3/8) | 50.0% (4/8) |
| NHL | 58.3% (42/72) | 71.4% (5/7) | 25.0% (6/24) | 0/0 | 0/0 |
| NCAAB | 97.1% (33/34) | 0/0 | 82.4% (14/17) | 87.5% (7/8) | 53.3% (8/15) |
| EPL | 81.8% (9/11) | 45.5% (5/11) | 33.3% (1/3) | 0/0 | 0/0 |
| MLS | 73.5% (72/98) | 58.6% (17/29) | 71.4% (5/7) | 0/0 | 0/0 |

## Lines saved before tip

Pregame DraftKings spreads on file: 48. Team totals on file: 102. Covers picks on file: 221. A row counts only when its retrieval time is before the game. The completed games in this run are older than these retrievals, so the pregame cover record, the team-total record, and the Covers record are 0/0. They stay out of the alert until a count exists. The prop file is separate and stays 0/0 until a saved prop line is older than a completed game.

FanDuel tags the main passing, rushing, and receiving total as HIGH. That line is the two-sided over/under. Markets tagged ALT are left out.

