# FanDuel and DraftKings access

Retrieved 2026-10-30T21:36:10.257Z UTC. These are the book numbers. They are not a model and they are not a priced edge.

## DraftKings

Feed: `https://sportsbook-nash.draftkings.com/api/sportscontent/prepack/v1/leagues/{league}/categories/{category}/subcategories/{subcategory}`

League ids: NFL `88808`, NBA `42648`, NHL `42133`.

| Board | Rows |
| --- | --- |
| NFL Touchdown scorer | 1131 |
| NFL Receiving yards | 286 |
| NFL Receptions | 286 |
| NBA Points | 264 |
| NBA Rebounds | 250 |
| NBA Assists | 180 |
| NFL Game lines | 156 |
| NFL Rush yards | 148 |
| NBA Game lines | 90 |
| NHL Game lines | 78 |
| NFL Pass yards | 52 |

Sample: CLE Browns @ PIT Steelers, Aaron Rodgers Passing Yards O/U, Over 219.5 -113.

## FanDuel Ohio

Feed: `https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId={nfl|nba|nhl}&_ak=FhMFpcPWXMeyZxOx`

| Game-line prices | 386 |
| Player-market prices on that page | 568 |

Sample: Chicago Bears @ Seattle Seahawks, Any Time Touchdown Scorer, D'Andre Swift -115.

The Ohio NBA page did not attach player points, rebounds, or assists. DraftKings did. Premade parlays are not in these line and prop feeds. They are in `docs/projections/PREMADE-PARLAYS.md`.

The rows are in `docs/projections/book-access.json`.
