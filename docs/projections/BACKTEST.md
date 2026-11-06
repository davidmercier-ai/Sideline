# Walk-forward backtest

Run at 2026-11-06T22:53:48.031Z UTC. Each game uses only that team's completed games from earlier in the same season. The game being scored is not in its own sample.

This is a record of the venue-matched mean, the four-model vote, and the 2,000-draw sim. It is not a priced edge. A straight-up hit means the side with the higher number won. A cover means the venue-matched margin and the actual margin sat on the same side of the ESPN spread. Pushes are left out of the rates.

| League | Games scored | Venue side | Unanimous side | Stable sim side | Always home | Venue cover | Margin error | Total error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFL | 98 of 122 | 55.7% (54/97) | 59.0% (36/61) | 46.2% (6/13) | 49.5% | 52.2% (48/92) | 11.0 | 14.0 |
| NBA | 100 of 123 | 61.0% (61/100) | 66.2% (45/68) | 56.5% (13/23) | 51.0% | 51.0% (51/100) | 14.0 | 16.5 |
| NHL | 245 of 261 | 51.4% (126/245) | 51.0% (52/102) | 57.4% (85/148) | 57.1% | 57.9% (139/240) | 2.4 | 2.0 |

Games with no prior venue sample are not scored. The stable sim side skips a game when any venue list has fewer than 3 games. Always home is the rate at which the home team won the decided games, shown so the model rates have a simple comparison.

The cover column uses the ESPN schedule spread when that quote is present, and the DraftKings pick-center spread from the game summary when the schedule quote is missing. A game with neither stays out of the cover rate. That is a missing price, not a cover rate of zero.

