# Walk-forward backtest

Run at 2026-11-07T00:07:16.237Z UTC. Each game uses only that team's completed games from earlier in the same season. The game being scored is not in its own sample.

This is a record of the venue-matched mean, the four-model vote, and the 2,000-draw sim. It is not a priced edge. A straight-up hit means the side with the higher number won. A cover means the venue-matched margin and the actual margin sat on the same side of the DraftKings spread. Pushes are left out of the rates.

| League | Games scored | Venue side | Unanimous side | Stable sim side | Always home | Venue cover | Margin error | Total error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFL | 98 of 122 | 55.7% (54/97) | 59.0% (36/61) | 46.2% (6/13) | 49.5% | 52.2% (48/92) | 11.0 | 14.0 |
| NBA | 100 of 123 | 61.0% (61/100) | 66.2% (45/68) | 56.5% (13/23) | 51.0% | 51.0% (51/100) | 14.0 | 16.5 |
| NHL | 245 of 261 | 51.4% (126/245) | 51.0% (52/102) | 57.4% (85/148) | 57.1% | 57.9% (139/240) | 2.4 | 2.0 |
| NCAAB | 60 of 303 | 81.7% (49/60) | 81.1% (43/53) | missing (0/0) | 85.0% | 46.5% (20/43) | 20.6 | 21.1 |

Games with no prior venue sample are not scored. The stable sim side skips a game when any venue list has fewer than 3 games. Always home is the rate at which the home team won the decided games, shown so the model rates have a simple comparison. NCAAB uses the 2026-27 season only. Its venue side is below always home, so a college side stays a lean.

The cover column uses only the DraftKings pick-center spread from the game summary. Another book’s number stays out. A game with no DraftKings spread stays out of the cover rate. That is a missing price, not a cover rate of zero.

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
| NCAAB | 53.6% (15/28) | 33.3% (5/15) | 41.9% (18/43) |

## Short of the number, favorite and dog

Unanimous sides whose closest read is short of the spread, split by favorite and dog. Every favorite is the straight-up win rate of the favorite in the same walk-forward, with no model involved. A pick'em is left out. This side is not a bet.

| League | Short, favorite | Every favorite | Short, dog |
| --- | --- | --- | --- |
| NFL | 62.5% (20/32) | 61.9% (60/97) | 0/0 |
| NBA | 76.5% (26/34) | 69.0% (69/100) | 0/0 |
| NHL | 57.7% (41/71) | 63.3% (155/245) | 0/0 |
| NCAAB | 91.7% (11/12) | 86.0% (37/43) | 0/0 |

NFL: the short-of-the-number favorites are within 5 points of every favorite. The cut is finished. It is not a bet.
NBA: the short-of-the-number favorites beat every favorite by more than 5 points. The gap stays on the record. It is not a bet.
NHL: the short-of-the-number favorites are within 5 points of every favorite. The cut is finished. It is not a bet.
NCAAB: the short-of-the-number favorites beat every favorite by more than 5 points. The gap stays on the record. It is not a bet.

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
| NCAAB | 91.7% (11/12) | 0/0 | 75.0% (6/8) | 83.3% (5/6) | 60.0% (6/10) |

