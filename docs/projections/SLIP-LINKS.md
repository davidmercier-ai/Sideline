# Slip links

Send the link. Run the command and copy the output. Do not retype a URL. Do not wrap a URL in a markdown link. Each URL is its own line inside one code block. A Lean or a Pass gets no link. Opening a link does not place the bet.

## Network

These feeds answered at 2:07 PM ET. Send `Accept: application/json` and `User-Agent: SidelineProjection/0.1`. A request with no user agent is refused.

DraftKings Ohio. Game lines are one GET. The event id is `events[].id`. The event name is `events[].name`. The selection id is `selections[].id` on the market whose `eventId` is that game and whose `name` is `Spread`, `Total`, `Moneyline`, or `Puck Line`.

```
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/88808/categories/492
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42648/categories/487
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42133/categories/496/subcategories/4525
```

The first is NFL. The second is NBA. The third is NHL moneyline, puck line, and total. NHL team totals are a different feed and are not the game line.

```
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42133/categories/1193
```

Player props, when the leg is a prop:

```
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/88808/categories/1000/subcategories/9524
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/88808/categories/1001/subcategories/9514
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/88808/categories/1342/subcategories/14114
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42648/categories/1215/subcategories/12488
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42648/categories/1216/subcategories/12492
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42648/categories/1217/subcategories/12495
```

Those six are NFL pass yards, rush yards, receiving yards, then NBA points, rebounds, and assists.

If the league feed has no `seoIdentifier`, one event has it:

```
https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/events/EVENTID/categories
```

FanDuel Ohio. The market id is `attachments.markets[].marketId`. The selection id is `runners[].selectionId`. The page id is `nfl`, `nba`, or `nhl`.

```
https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nfl&_ak=FhMFpcPWXMeyZxOx
https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nba&_ak=FhMFpcPWXMeyZxOx
https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nhl&_ak=FhMFpcPWXMeyZxOx
```

Take the ids from that response and pass them to the commands below. Do not build the slip from the feed URL.

## DraftKings

Copy three values off the live event. Nothing else.

- `event.name`, for example `TB Buccaneers @ CHI Bears`
- `event.id`, for example `34118027`
- `selection.id` for each leg, for example `0OU84695460U4750_3`

The event id is `events[].id`. The selection id is `selections[].id` on the market whose label and points are the side you are sending. Recheck both after a number moves. A dead id adds nothing.

```
node scripts/slip-link.mjs dk "TB Buccaneers @ CHI Bears" 34118027 0OU84695460U4750_3
```

That command prints two lines. The first is the desktop slip. The second is the phone add. Copy both.

```
https://sportsbook.draftkings.com/event/tb-buccaneers-%40-chi-bears/34118027?outcomes=0OU84695460U4750_3
dksb://sb/addbet/0OU84695460U4750_3
```

That pair is the shape. It is not a bet. Buccaneers at Bears is a pass.

A second selection id goes on the end of the same command. The desktop line lists every id after `outcomes=`, separated by a comma. The phone gets one `dksb://sb/addbet/` line per id. Tap those one at a time.

A `#` in a selection id is `%23` in the printed line. This is the two-leg shape:

```
node scripts/slip-link.mjs dk "SJ Sharks @ LA Kings" 34118045 "0QA382657149#2341145992_13L88808Q1-549717439Q20" "0QA2#3"
```

```
https://sportsbook.draftkings.com/event/sj-sharks-%40-la-kings/34118045?outcomes=0QA382657149%232341145992_13L88808Q1-549717439Q20,0QA2%233
dksb://sb/addbet/0QA382657149%232341145992_13L88808Q1-549717439Q20
dksb://sb/addbet/0QA2%233
```

The path uses the first event only. Every selection id still goes in `outcomes`. No event id means no desktop line.

If the script is not there, use `seoIdentifier` from `https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/events/EVENTID/categories`. For the Bears game that field is `tb-buccaneers-%40-chi-bears`. Put it in front of the event id.

```
https://sportsbook.draftkings.com/event/SEOIDENTIFIER/EVENTID?outcomes=SELECTIONID
dksb://sb/addbet/SELECTIONID
```

Replace `#` with `%23` inside a selection id. Leave the comma between ids as a comma.

Do not send these.

```
https://sportsbook.draftkings.com/?outcomes=
https://sportsbook.draftkings.com/event/34118027?outcomes=
https://dksb.sng.link/
```

The homepage link drops the picks. The event link with no slug redirects, and the phone drops the picks. `https://dksb.sng.link/` opens the App Store. A desktop link on the phone opens the game and leaves the slip empty, so the phone also gets the `dksb://` line.

## FanDuel

Copy two values per leg.

- `marketId`, for example `739.194082469`
- `selectionId`, for example `7017917`

Over on a total is often selection id `7017916`. Under is often `7017917`. The market id is what picks the game. A selection id alone is the wrong game.

One leg:

```
node scripts/slip-link.mjs fd 739.194082469 7017917
```

```
https://sportsbook.fanduel.com/addToBetslip?marketId=739.194082469&selectionId=7017917
```

Two legs. The brackets in a message are `%5B` and `%5D`. A literal `[0]` gets cut off.

```
node scripts/slip-link.mjs fd 739.194644207 41173071 739.194851132 49541845
```

```
https://sportsbook.fanduel.com/addToBetslip?marketId%5B0%5D=739.194644207&selectionId%5B0%5D=41173071&marketId%5B1%5D=739.194851132&selectionId%5B1%5D=49541845
```

Confirm the player and the number on the slip before treating it as placed.

## Price

Same number: the higher American price gets the link. Different numbers are not ranked. A number already on a ticket stays that number. A worse number gets no link. For a favorite, laying more points is worse. For an under, the lower total is worse. For an over, the higher total is worse.

## Check

```
node scripts/slip-link.mjs self-test
```

`self-test ok` means the printer matches the shapes above.
