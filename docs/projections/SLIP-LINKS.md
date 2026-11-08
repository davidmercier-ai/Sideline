# Slip links

Copy this file as-is. A Lean or a Pass gets no link. Opening a link does not place the bet. Recheck the selection id on the live feed before sending it. A moved number kills the old id, and a dead id adds nothing.

## DraftKings, desktop

The web slip is one event address plus `?outcomes=`. The ids are joined with a comma. The path is the event slug, then the event id.

```
https://sportsbook.draftkings.com/event/{slug}/{eventId}?outcomes={id1},{id2}
```

The slug is the DraftKings event name in lowercase. Spaces become hyphens. ` @ ` becomes `-%40-`. `SJ Sharks @ LA Kings` becomes `sj-sharks-%40-la-kings`. A `#` inside a selection id becomes `%23`. The comma between ids stays a comma.

Two legs on event `34118045`:

```
https://sportsbook.draftkings.com/event/sj-sharks-%40-la-kings/34118045?outcomes=0QA382657149%232341145992_13L88808Q1-549717439Q20,0QA2%233
```

The raw ids were:

```
0QA382657149#2341145992_13L88808Q1-549717439Q20
0QA2#3
```

After the link is decoded, the site splits `outcomes` on a comma, a plus, or a space.

A parlay that spans two events still uses the first event in the path. Every selection id still goes in `outcomes`. No event id means no web link.

Drop these. Each one fails.

```
https://sportsbook.draftkings.com/?outcomes=
https://sportsbook.draftkings.com/event/34118045?outcomes=
https://dksb.sng.link/
```

`https://sportsbook.draftkings.com/?outcomes=` opens the homepage and the picks never land. `https://sportsbook.draftkings.com/event/34118045?outcomes=` has no slug. That short address redirects, and the phone drops the picks on the redirect. A raw `#` in the id gets cut by the browser at the hash. `https://dksb.sng.link/` falls through to the App Store.

## DraftKings, phone

The phone gets one add link per leg, tapped one at a time. Several picks are several links. One link cannot carry two ids.

```
dksb://sb/addbet/0OU87064453U650_3
dksb://sb/addbet/0QA382657149%232341145992_13L88808Q1-549717439Q20
```

A `sportsbook.draftkings.com` event link opens the game and leaves the phone slip empty. On this phone, a chat link had not added a pick as of Wednesday, November 4. Until a tap from this phone puts a pick on the slip, the message names the game, the market, and the side, and it does not include a DraftKings link. The desktop shape above is still the web slip.

## FanDuel

One leg uses `marketId` and `selectionId`.

```
https://sportsbook.fanduel.com/addToBetslip?marketId=739.194351327&selectionId=42200635
```

Several legs use `marketId[n]` and `selectionId[n]`, starting at 0. In a message those brackets are `%5B` and `%5D`. A chat client cuts a literal `[0]`.

```
https://sportsbook.fanduel.com/addToBetslip?marketId%5B0%5D=739.194644207&selectionId%5B0%5D=41173071&marketId%5B1%5D=739.194851132&selectionId%5B1%5D=49541845
```

That shape landed on the phone Wednesday, November 4, at 5:24 PM ET. The market id is what picks the game. FanDuel reuses `7017916` for every over and `7017917` for every under, so a selection id alone is the wrong game. Confirm the player and the number on the slip before treating it as placed.

## Price

Same number: the higher American price gets the link. Different numbers are not ranked. A number already on a ticket stays that number. A worse number gets no link. For a favorite, laying more points is worse. For an under, the lower total is worse. For an over, the higher total is worse.

## Copy block

```
DRAFTKINGS DESKTOP
https://sportsbook.draftkings.com/event/{slug}/{eventId}?outcomes={id1},{id2}

Slug: lowercase event name. Spaces become hyphens. " @ " becomes "-%40-".
"SJ Sharks @ LA Kings" becomes sj-sharks-%40-la-kings.
A # inside a selection id becomes %23. The comma between ids stays a comma.
The path is the first event only. Every selection id still goes in outcomes.
No event id means no web link.

Example, two legs on event 34118045:
https://sportsbook.draftkings.com/event/sj-sharks-%40-la-kings/34118045?outcomes=0QA382657149%232341145992_13L88808Q1-549717439Q20,0QA2%233

Raw ids were:
0QA382657149#2341145992_13L88808Q1-549717439Q20
0QA2#3

DRAFTKINGS PHONE
One link per leg. Tap them one at a time. One link cannot carry two ids.

dksb://sb/addbet/0OU87064453U650_3
dksb://sb/addbet/0QA382657149%232341145992_13L88808Q1-549717439Q20

Do not send these:
https://sportsbook.draftkings.com/?outcomes=
https://sportsbook.draftkings.com/event/34118045?outcomes=
https://dksb.sng.link/

A sportsbook.draftkings.com link opens the game and leaves the phone slip empty.
On this phone, a chat link had not added a pick as of Wednesday, November 4.
Until a tap from this phone puts a pick on the slip, name the game, the market, and the side, and do not include a DraftKings link.

FANDUEL ONE LEG
https://sportsbook.fanduel.com/addToBetslip?marketId=739.194351327&selectionId=42200635

FANDUEL SEVERAL LEGS
In a message the brackets are %5B and %5D. A literal [0] gets cut off.

https://sportsbook.fanduel.com/addToBetslip?marketId%5B0%5D=739.194644207&selectionId%5B0%5D=41173071&marketId%5B1%5D=739.194851132&selectionId%5B1%5D=49541845

The market id picks the game. FanDuel reuses 7017916 for every over and 7017917 for every under. A selection id alone is the wrong game.

RULES
A Lean or a Pass gets no link. Opening a link does not place the bet.
Recheck the selection id on the live feed. A moved number kills the old id.
Same number: the higher American price gets the link. Different numbers are not ranked.
A number already on a ticket stays that number. A worse number gets no link.
A favorite laying more points is worse. A lower under is worse. A higher over is worse.
```
