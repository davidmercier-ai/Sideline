# Memory

A dated note. It does not enter the four models. The rules are in `COMMANDMENTS.md`.

## Slip links

Standing instructions. Written Wednesday, November 4, 2026, 3:06 PM ET. A message uses these. A Lean or a Pass gets no link. Opening a link does not place the bet.

A DraftKings message uses one `dksb://sb/addbet/` link per selection, from `draftKingsPhoneLinks` in `scripts/projection-math.mjs`. Tap one link, that pick lands, then tap the next. Do not send `https://sportsbook.draftkings.com/event/...` in a message. On the phone that address opens the game and the picks are not added. The short `/event/{id}` path redirects, and the app drops the picks on that redirect. The homepage `/?outcomes=` link is dropped. Do not join selection ids with `%2B` or a raw plus. A raw plus is read as a space. Do not send `https://dksb.sng.link/`. That address falls through to the App Store.

A hash in a selection id is `%23` inside `dksb://sb/addbet/`. One pick is one link. A slip is several taps, not one combined link.

The desktop site is the only place for a sportsbook.draftkings.com slip. That web link names the first event and its slug, then `?outcomes=` with the same ids joined by a comma. The slug is the event name in lowercase. Spaces become hyphens. ` @ ` becomes `-%40-`. No event id means no web link. The site splits `outcomes` on a comma, a plus, or a space after the query is decoded. The phone does not. The phone gets the add path only.

Recheck every selection id on the live feed before the link is sent. A moved number kills the old id, and a dead id adds nothing. Derrick White under 16.5 died when DraftKings moved the number to 17.5.

A FanDuel message uses `addToBetslip` with `marketId` and `selectionId`. Several legs use `marketId[n]` and `selectionId[n]`. In a message those brackets are `%5B` and `%5D`. A shared selection id still needs its market id. Confirm the player and the number on the slip before the bet is treated as placed.

A number already on a ticket stays that number. A later price on that same side is not a new bet, and the other side is not a hedge. A worse number does not get a link. For a favorite, laying more points is worse. For an under, the lower total is worse. For an over, the higher total is worse. When the number is the same, only the higher American price gets the link.

## Wednesday, November 4, 2026, 1:50 PM ET

The card named NBA, college basketball, college football, FCS, NHL, and soccer. Each sport gets its own answer.

College football had three games and no bet. Ball State at UMass was 49.5 at both books. The four totals were 52.1, 52.4, 51.8, and 51. UMass's home log includes Sacred Heart and Stonehill. The FBS home games were 52 and 39, and 39 misses 49.5. Central Michigan at Eastern Michigan was 44.5. The four totals were 45.8, 45.4, 45.8, and 45.8. Closest room 0.9. Toledo's reads were a win by 6 to 15.5. FanDuel was Toledo −24.5 and DraftKings was −25.5. The total 52.5 sat inside the reads.

College basketball had 26 games. Every venue slice was under 3. No bet.

FCS had no games.

NHL had two bets. Blackhawks at Panthers over 5.5, both books, DraftKings −135 the better price. Sharks at Kings under 6.5, DraftKings −125. Senators at Sabres was a split. Flames at Kraken over 6.5 had a closest room of 0.1.

Soccer was the Champions League only. Every venue slice was 1 or 2 games. No bet. Premier League, MLS, and J1 had no games.

The DraftKings homepage outcomes link was dropped on the phone. The Hawks under moved from 231.5 to 230.5, and the old selection id killed the parlay. The slip-link instructions above are the rule for the next link.

A number already on a ticket stays that number. Grizzlies −5.5 is in the FanDuel parlay. DraftKings later showed −6.5. That is a worse number. A worse number does not get a link. The other side is not a hedge. For a favorite, laying more points is worse. For an under, the lower total is worse. For an over, the higher total is worse. Hawks under 230.5 is worse than 231.5. This is the same mistake as the soccer card: a second, worse number after the first one was already bet.
