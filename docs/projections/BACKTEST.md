# Walk-forward backtest

Run at 2026-10-30T20:36:50.457Z UTC. Each game uses only that team's completed games from earlier in the same season. The game being scored is not in its own sample.

This is a record of the venue-matched mean, the four-model vote, and the 2,000-draw sim. It is not a priced edge. A straight-up hit means the side with the higher number won. A cover means the venue-matched margin and the actual margin sat on the same side of the ESPN spread. Pushes are left out of the rates.

| League | Games scored | Venue side | Unanimous side | Stable sim side | Always home | Venue cover | Margin error | Total error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFL | 84 of 108 | 55.4% (46/83) | 56.6% (30/53) | 60.0% (3/5) | 47.0% | missing (0/0) | 10.8 | 14.4 |
| NBA | 48 of 71 | 58.3% (28/48) | 59.4% (19/32) | missing (0/0) | 45.8% | missing (0/0) | 16.1 | 17.0 |
| NHL | 197 of 213 | 49.2% (97/197) | 49.4% (42/85) | 55.0% (55/100) | 58.4% | missing (0/0) | 2.4 | 2.0 |

Games with no prior venue sample are not scored. The stable sim side skips a game when any venue list has fewer than 3 games. Always home is the rate at which the home team won the decided games, shown so the model rates have a simple comparison.

The cover column is missing when the completed-game payload did not include an ESPN spread. That is a missing price, not a cover rate of zero.

