# Premade parlay scan

Scanned 2026-10-30 from the same public feeds used for the game lines. A premade parlay here means a fixed set of legs with one combined price. A menu of markets you may combine is not that.

## FanDuel Ohio

League page: `https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId={nfl|nba}&_ak=FhMFpcPWXMeyZxOx`

Event page: `https://sbapi.oh.sportsbook.fanduel.com/api/event-page?_ak=FhMFpcPWXMeyZxOx&eventId={id}`

- The NFL and NBA event pages have cards named Popular, Quick Bets, and Same Game Parlay. Those cards list market types. The response attaches the game line and leaves the parlay card unloaded. No legs and no combined price came back.
- The NFL league page has a card titled Tekeyah's Novelty Parlay. Its coupon points at event `35193825`. The event page for that id returned an empty layout. The legs were not attached.
- The same NFL page does include individual player markets: an anytime-touchdown market on each Week 9 game, and alternate high yardage ladders on Vikings at Lions, Ravens at Bills, and Colts at Jaguars. Those are single props, not parlays.
- The NBA league page has game lines and futures. It has no player points, rebounds, or assists props, and no priced parlay.

## DraftKings

Content feed that answers: `https://sportsbook-nash.draftkings.com/api/sportscontent/prepack/v1/leagues/88808` (NFL).

- That feed returns events, markets, and selections. Markets are tagged `SGP` when DraftKings allows them inside a same-game parlay. The objects are single markets, not a priced combination.
- The site config names a prepack host and a parlay host. Requests for the league and for Ravens at Bills (`34118214`) on those paths returned 404.
- The ESPN quote used for DraftKings game lines does not include a parlay.

No premade parlay was analyzed, because neither book sent the legs and the combined price.
