# Walk-forward backtest

Run at 2026-11-07T00:28:04.940Z UTC. Each game uses only that team's completed games from earlier in the same season. The game being scored is not in its own sample.

This is a record of the venue-matched mean, the four-model vote, and the 2,000-draw sim. It is not a priced edge. A straight-up hit means the side with the higher number won. A cover means the venue-matched margin and the actual margin sat on the same side of the DraftKings spread. Pushes are left out of the rates.

| League | Games scored | Venue side | Unanimous side | Stable sim side | Always home | Venue cover | Margin error | Total error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFL | 98 of 122 | 55.7% (54/97) | 59.0% (36/61) | 46.2% (6/13) | 49.5% | 52.2% (48/92) | 11.0 | 14.0 |
| NBA | 100 of 123 | 61.0% (61/100) | 66.2% (45/68) | 56.5% (13/23) | 51.0% | 51.0% (51/100) | 14.0 | 16.5 |
| NHL | 245 of 261 | 51.4% (126/245) | 51.0% (52/102) | 57.4% (85/148) | 57.1% | 57.9% (139/240) | 2.4 | 2.0 |
| NCAAB | 62 of 305 | 82.3% (51/62) | 81.8% (45/55) | missing (0/0) | 85.5% | 46.7% (21/45) | 20.4 | 20.5 |

Games with no prior venue sample are not scored. The stable sim side skips a game when any venue list has fewer than 3 games. Always home is the rate at which the home team won the decided games, shown so the model rates have a simple comparison. NCAAB uses the 2026-27 season only. Its venue side is below always home, so a college side stays a lean.

The cover column uses the DraftKings number on the completed-game summary. That is not a line saved before tip. Pregame spreads are stored apart and are not used in this column until one is older than the game. A game with no DraftKings spread stays out of the cover rate.

## Board rule

A board side needs four finite reads on the same side of the spread, each at least the room past that number, and every venue list at 3 games or more. The room is 1 point in the NFL and NBA and 0.25 goals in the NHL. A board total is the same test against the posted total. A hit means the game finished on that side. A push is left out. This is a record of the filter, not a priced edge.

| League | Board sides | Side covers | Board totals | Total hits |
| --- | --- | --- | --- | --- |
| NFL | 0 | 0/0 | 3 | 0.0% (0/3) |
| NBA | 4 | 25.0% (1/4) | 6 | 33.3% (2/6) |
| NHL | 8 | 62.5% (5/8) | 43 | 48.8% (21/43) |
| NCAAB | 0 | 0/0 | 0 | 0/0 |

## Favorite and dog covers

The venue-mean cover, split by whether that pick was the favorite or the dog. A negative home spread means the home team was favored. A pick'em is left out. Dog covered, any pick is how often the dog covered with no model involved, so the dog-pick column has a baseline.

| League | Favorite picks | Dog picks | Dog covered, any pick |
| --- | --- | --- | --- |
| NFL | 43.8% (21/48) | 61.4% (27/44) | 57.9% (55/95) |
| NBA | 53.1% (26/49) | 49.0% (25/51) | 48.0% (48/100) |
| NHL | 40.0% (16/40) | 61.5% (123/200) | 61.2% (150/245) |
| NCAAB | 53.6% (15/28) | 35.3% (6/17) | 42.2% (19/45) |

## Short of the number, favorite and dog

Unanimous sides whose closest read is short of the spread, split by favorite and dog. Every favorite is the straight-up win rate of the favorite in the same walk-forward, with no model involved. A pick'em is left out. This side is not a bet.

| League | Short, favorite | Every favorite | Short, dog |
| --- | --- | --- | --- |
| NFL | 62.5% (20/32) | 61.9% (60/97) | 0/0 |
| NBA | 76.5% (26/34) | 69.0% (69/100) | 0/0 |
| NHL | 57.7% (41/71) | 63.3% (155/245) | 0/0 |
| NCAAB | 92.9% (13/14) | 86.7% (39/45) | 0/0 |

NFL: the short-of-the-number favorites are within 5 points of every favorite. The cut is finished. It is not a bet.
NBA: the short-of-the-number favorites beat every favorite by more than 5 points. The later sample has no games yet, so open stays a note. It is not a bet.
NHL: the short-of-the-number favorites are within 5 points of every favorite. The cut is finished. It is not a bet.
NCAAB: the short-of-the-number favorites beat every favorite by more than 5 points. The later sample has no games yet, so open stays a note. It is not a bet.

## Where the short favorites sit

The short-of-the-number favorites, split by home or road and by the size of the spread. The unit is points in football and basketball and goals in hockey.

| League | Home favorite | Road favorite | Spread under 3 | 3 to 7 | 7 to 12 | 12 or more |
| --- | --- | --- | --- | --- | --- | --- |
| NFL | 63.6% (14/22) | 60.0% (6/10) | 50.0% (2/4) | 71.4% (10/14) | 58.3% (7/12) | 50.0% (1/2) |
| NBA | 76.2% (16/21) | 76.9% (10/13) | 0.0% (0/2) | 60.0% (6/10) | 81.8% (9/11) | 100.0% (11/11) |
| NHL | 73.7% (28/38) | 39.4% (13/33) | 57.7% (41/71) | 0/0 | 0/0 | 0/0 |
| NCAAB | 92.9% (13/14) | 0/0 | 0/0 | 0/0 | 0.0% (0/1) | 100.0% (13/13) |

Games after 2026-11-07T00:07:16.237Z are the confirming sample. The games that produced the gap are not in it. Until that sample has a count, open stays a note.

| League | Short favorites after the freeze | Every favorite after the freeze |
| --- | --- | --- |
| NFL | 0/0 | 0/0 |
| NBA | 0/0 | 0/0 |
| NHL | 0/0 | 0/0 |
| NCAAB | 0/0 | 0/0 |

## Scar and on the number

A scar is the venue reads on one side and the last available read on the other. On the number is a unanimous side whose closest read lands on the spread. Each is compared with every favorite in that league. A slice that does not beat every favorite is not a bet.

| League | Scar | On the number | Every favorite |
| --- | --- | --- | --- |
| NFL | 50.0% (1/2) | 0/0 | 61.9% (60/97) |
| NBA | 0.0% (0/3) | 0/0 | 69.0% (69/100) |
| NHL | 58.6% (17/29) | 0/0 | 63.3% (155/245) |
| NCAAB | 0/0 | 0/0 | 86.7% (39/45) |

## Public models

The ESPN Matchup Predictor is read from the completed-game predictor, when that source still has a win chance. The side is whoever the predictor scored higher. Covers is the current board only, so a Covers row counts only when a saved pick is older than the game. Neither is blended into the four reads.

| League | ESPN predictor |
| --- | --- |
| NFL | 60.8% (59/97) |
| NBA | 67.0% (67/100) |
| NHL | 0/0 |
| NCAAB | 90.3% (56/62) |

## Opponent allowance

One read, kept out of the four and out of the alert. The away score is the home team’s home points allowed. The home score is the away team’s road points allowed. A side is counted only when both lists have at least 3 games. A hit is a straight-up win. This is not a priced edge.

| League | Allowance side |
| --- | --- |
| NFL | 46.2% (6/13) |
| NBA | 47.8% (11/23) |
| NHL | 56.3% (80/142) |
| NCAAB | 0/0 |

## Unanimous side by gap to the spread

The unanimous side is every decided game where the finite reads picked the same winner. The gap is the closest of those reads to the spread, on that side. A negative gap means the closest read sat on the other side of the number. A hit is a straight-up win. The cuts are the league’s scoring unit: points in the NFL and NBA, goals in the NHL. A game with no spread stays out. This is not a priced edge.

| League | Short of the number | 0 to 1 | 1 to 5 | 5 to 10 | 10 or more |
| --- | --- | --- | --- | --- | --- |
| NFL | 62.5% (20/32) | 57.1% (4/7) | 46.2% (6/13) | 80.0% (4/5) | 50.0% (2/4) |
| NBA | 76.5% (26/34) | 75.0% (3/4) | 60.0% (9/15) | 42.9% (3/7) | 50.0% (4/8) |
| NHL | 57.7% (41/71) | 71.4% (5/7) | 25.0% (6/24) | 0/0 | 0/0 |
| NCAAB | 92.9% (13/14) | 0/0 | 75.0% (6/8) | 83.3% (5/6) | 60.0% (6/10) |

## Lines saved before tip

Pregame DraftKings spreads on file: 34. Team totals on file: 93. Covers picks on file: 115. A row counts only when its retrieval time is before the game. The completed games in this run are older than these retrievals, so the pregame cover record, the team-total record, and the Covers record are 0/0. They stay out of the alert until a count exists. The prop file is separate and stays 0/0 until a saved prop line is older than a completed game.

FanDuel tags the main passing, rushing, and receiving total as HIGH. That line is the two-sided over/under. Markets tagged ALT are left out.

