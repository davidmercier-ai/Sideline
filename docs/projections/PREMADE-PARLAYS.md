# Premade parlays

Retrieved 2026-10-30T21:25:14.202Z UTC (Oct 30, 2026, 5:25 PM ET). These are the books' combined prices. They are not a model and they are not a priced edge.

A premade parlay is a fixed set of legs with one combined American price. The earlier game-line feeds did not send these. The website cards did.

## Access

FanDuel Ohio. The site calls `https://boapi.sportsbook.fanduel.com/betting-opportunities/all` with `cardVersion`, `_ak=FhMFpcPWXMeyZxOx`, `eventTypeId`, `competitionIds`, and `source`. The request needs header `x-sportsbook-region: OH`.

Event type ids: NFL and college football `6423`, NBA `7522`, NHL `7524`. Competition ids: NFL `12282733`, NCAA Football Games `12529073`, NBA `10547864`, NHL `12550521`. Each request is read for `ORGANIC` and `MANUAL`, and again with `type=SGP`. The card returns at most 50 rows per request. Duplicate ids are dropped.

DraftKings Ohio. The sportsbook page loads the prepacks widget, which calls:

`https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/prepacks/sportsdata/v2/prepacks?leagueId={id}&includeFilters=true&locale=en-us`

League ids: NFL `88808`, NBA `42648`, NHL `42133`, NCAAF `87637`. A league request with no odds range returns the default Under +200 tab. The other price tabs are in `docs/projections/DK-PREBUILT.md`.

## Counts

| Book | Board | Rows |
| --- | --- | --- |
| FanDuel | NBA PARLAY | 34 |
| FanDuel | NBA SGP | 50 |
| FanDuel | NBA SGP_PLUS | 5 |
| FanDuel | NCAAF PARLAY | 49 |
| FanDuel | NCAAF SGP | 7 |
| FanDuel | NCAAF SGP_PLUS | 1 |
| FanDuel | NFL PARLAY | 23 |
| FanDuel | NFL SGP | 50 |
| FanDuel | NFL SGP_PLUS | 3 |
| FanDuel | NHL PARLAY | 38 |
| FanDuel | NHL SGP | 30 |
| FanDuel | NHL SGP_PLUS | 4 |
| DraftKings | NBA SGP | 16 |
| DraftKings | NCAAF SGP | 13 |
| DraftKings | NFL SGP | 16 |
| DraftKings | NHL SGP | 4 |

FanDuel rows: 294. DraftKings rows: 49.

## How to read a leg

The combined price belongs to the whole parlay. A player leg has no projection, so that leg stays missing. A moneyline, game total, or team total is set next to the venue-matched score only when that game is already on a retrieved slate from October 30 through November 5. The four models are not refit to the parlay. A point gap is not a priced edge. A sim percentage is the share of the draws.

## Same-game parlays

- **+170** CLE Browns @ PIT Steelers, Nov 1, 1:00 PM ET
  - PIT Steelers (Moneyline). Browns at Steelers. Models: Steelers, 4–0. Sim: 19.5–25.5, Steelers 79.6%. Venue-matched score 19.3–25.8.
  - Over 21.5 (PIT Steelers: Team Total Points). Browns at Steelers. Venue-matched home score 25.8. Book team total 21.5.
  - Over 2.5 (PIT Steelers: Team Total Touchdowns). Browns at Steelers is on a retrieved slate. No projection is attached to this market.

- **+116** TEN Titans @ CIN Bengals, Nov 1, 1:00 PM ET
  - CIN Bengals (Moneyline). Titans at Bengals. Models: Bengals, 4–0. Sim: 22.5–22.5, Bengals 52.2%, thin. Venue-matched score 20.8–21.8.
  - Over 29.5 (CIN Bengals: Team Total Points). Titans at Bengals. Venue-matched home score 21.8. Book team total 29.5.
  - Over 3.5 (CIN Bengals: Team Total Touchdowns). Titans at Bengals is on a retrieved slate. No projection is attached to this market.

- **+158** TEN Titans @ CIN Bengals, Nov 1, 1:00 PM ET
  - CIN Bengals (Moneyline). Titans at Bengals. Models: Bengals, 4–0. Sim: 22.5–22.5, Bengals 52.2%, thin. Venue-matched score 20.8–21.8.
  - CIN Bengals (Moneyline 1st Quarter). Titans at Bengals is on a retrieved slate. No projection is attached to this market.
  - Over 46.5 (Total). Titans at Bengals. Venue-matched total 42.6. Book number 46.5.

- **+104** ARI Cardinals @ DAL Cowboys, Nov 1, 1:00 PM ET
  - DAL Cowboys (Moneyline). Cardinals at Cowboys. Models: Cowboys, 4–0. Sim: 24–26, Cowboys 68.8%, thin. Venue-matched score 23.3–26.
  - Over 30.5 (DAL Cowboys: Team Total Points). Cardinals at Cowboys. Venue-matched home score 26. Book team total 30.5.
  - Over 3.5 (DAL Cowboys: Team Total Touchdowns). Cardinals at Cowboys is on a retrieved slate. No projection is attached to this market.

- **+154** ATL Falcons @ TB Buccaneers, Nov 1, 1:00 PM ET
  - TB Buccaneers (Moneyline). Falcons at Buccaneers. Models: split, 2–2. Sim: 29–18, Falcons 79%. Venue-matched score 26.6–18.2.
  - Over 22.5 (TB Buccaneers: Team Total Points). Falcons at Buccaneers. Venue-matched home score 18.2. Book team total 22.5.
  - Over 2.5 (TB Buccaneers: Team Total Touchdowns). Falcons at Buccaneers is on a retrieved slate. No projection is attached to this market.

- **+156** LV Raiders @ NY Jets, Nov 1, 1:00 PM ET
  - NY Jets (Moneyline). Raiders at Jets. Models: split, 3–1 Jets. Sim: 23–22, Jets 52.8%. Venue-matched score 23–24.2.
  - Over 23.5 (NY Jets: Team Total Points). Raiders at Jets. Venue-matched home score 24.2. Book team total 23.5.
  - Over 2.5 (NY Jets: Team Total Touchdowns). Raiders at Jets is on a retrieved slate. No projection is attached to this market.

- **+188** LV Raiders @ NY Jets, Nov 1, 1:00 PM ET
  - LV Raiders (Moneyline). Raiders at Jets. Models: split, 3–1 Jets. Sim: 23–22, Jets 52.8%. Venue-matched score 23–24.2.
  - Over 22.5 (LV Raiders: Team Total Points). Raiders at Jets. Venue-matched away score 23. Book team total 22.5.
  - Over 2.5 (LV Raiders: Team Total Touchdowns). Raiders at Jets is on a retrieved slate. No projection is attached to this market.

- **+134** MIN Vikings @ DET Lions, Nov 1, 1:00 PM ET
  - DET Lions (Moneyline). Vikings at Lions. Models: split, 3–1 Vikings. Sim: 20–18, Vikings 61.3%. Venue-matched score 21–19.
  - Over 24.5 (DET Lions: Team Total Points). Vikings at Lions. Venue-matched home score 19. Book team total 24.5.
  - Over 2.5 (DET Lions: Team Total Touchdowns). Vikings at Lions is on a retrieved slate. No projection is attached to this market.

- **+138** BAL Ravens @ BUF Bills, Nov 1, 1:00 PM ET
  - BUF Bills (Moneyline). Ravens at Bills. Models: split, 2–2. Sim: 28.5–24.5, Ravens 55.9%. Venue-matched score 26.2–25.
  - Over 29.5 (BUF Bills: Team Total Points). Ravens at Bills. Venue-matched home score 25. Book team total 29.5.
  - Over 3.5 (BUF Bills: Team Total Touchdowns). Ravens at Bills is on a retrieved slate. No projection is attached to this market.

- **+134** IND Colts @ JAX Jaguars, Nov 1, 1:00 PM ET
  - JAX Jaguars (Moneyline). Colts at Jaguars. Models: Jaguars, 4–0. Sim: 14–34, Jaguars 100%, thin. Venue-matched score 14.3–31.1.
  - Over 28.5 (JAX Jaguars: Team Total Points). Colts at Jaguars. Venue-matched home score 31.1. Book team total 28.5.
  - Over 3.5 (JAX Jaguars: Team Total Touchdowns). Colts at Jaguars is on a retrieved slate. No projection is attached to this market.

- **+164** IND Colts @ JAX Jaguars, Nov 1, 1:00 PM ET
  - JAX Jaguars (Moneyline). Colts at Jaguars. Models: Jaguars, 4–0. Sim: 14–34, Jaguars 100%, thin. Venue-matched score 14.3–31.1.
  - JAX Jaguars (Moneyline 1st Quarter). Colts at Jaguars is on a retrieved slate. No projection is attached to this market.
  - Over 46.5 (Total). Colts at Jaguars. Venue-matched total 45.4. Book number 46.5.

- **+110** LA Chargers @ LA Rams, Nov 1, 4:05 PM ET
  - LA Rams (Moneyline). Chargers at Rams. Models: Rams, 4–0. Sim: 17–26, Rams 79.3%. Venue-matched score 17.7–25.7.
  - Over 26.5 (LA Rams: Team Total Points). Chargers at Rams. Venue-matched home score 25.7. Book team total 26.5.
  - Over 2.5 (LA Rams: Team Total Touchdowns). Chargers at Rams is on a retrieved slate. No projection is attached to this market.

- **+108** NE Patriots @ MIA Dolphins, Nov 1, 4:25 PM ET
  - NE Patriots (Moneyline). Patriots at Dolphins. Models: split, 3–1 Patriots. Sim: 20.5–20, Patriots 53.1%, thin. Venue-matched score 22.4–21.5.
  - Over 25.5 (NE Patriots: Team Total Points). Patriots at Dolphins. Venue-matched away score 22.4. Book team total 25.5.
  - Over 2.5 (NE Patriots: Team Total Touchdowns). Patriots at Dolphins is on a retrieved slate. No projection is attached to this market.

- **+196** KC Chiefs @ DEN Broncos, Nov 1, 4:25 PM ET
  - KC Chiefs (Moneyline). Chiefs at Broncos. Models: split, 3–1 Broncos. Sim: 19–20, Broncos 58%. Venue-matched score 18.3–20.7.
  - Over 20.5 (KC Chiefs: Team Total Points). Chiefs at Broncos. Venue-matched away score 18.3. Book team total 20.5.
  - Over 2.5 (KC Chiefs: Team Total Touchdowns). Chiefs at Broncos is on a retrieved slate. No projection is attached to this market.

- **+124** PHI Eagles @ WAS Commanders, Nov 1, 8:20 PM ET
  - WAS Commanders (Moneyline). Eagles at Commanders. Models: Commanders, 4–0. Sim: 19–27, Commanders 76.1%, thin. Venue-matched score 22.3–26.8.
  - Over 23.5 (WAS Commanders: Team Total Points). Eagles at Commanders. Venue-matched home score 26.8. Book team total 23.5.
  - Over 2.5 (WAS Commanders: Team Total Touchdowns). Eagles at Commanders is on a retrieved slate. No projection is attached to this market.

- **+128** CHI Bears @ SEA Seahawks, Nov 2, 8:20 PM ET
  - SEA Seahawks (Moneyline). Bears at Seahawks. Models: Seahawks, 4–0. Sim: 20.5–26.5, Seahawks 55.9%. Venue-matched score 24.7–26.7.
  - Over 24.5 (SEA Seahawks: Team Total Points). Bears at Seahawks. Venue-matched home score 26.7. Book team total 24.5.
  - Over 2.5 (SEA Seahawks: Team Total Touchdowns). Bears at Seahawks is on a retrieved slate. No projection is attached to this market.

- **+164** CHA Hornets @ WAS Wizards, Oct 30, 7:10 PM ET
  - CHA Hornets (Moneyline). Hornets at Wizards. Models: split, 3–1 Wizards. Sim: 111–112.5, Wizards 52%, thin. Venue-matched score 106.8–107.5.
  - Over 99.5 (Both Teams Total Points). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.

- **+188** CHA Hornets @ WAS Wizards, Oct 30, 7:10 PM ET
  - WAS Wizards (Moneyline). Hornets at Wizards. Models: split, 3–1 Wizards. Sim: 111–112.5, Wizards 52%, thin. Venue-matched score 106.8–107.5.
  - Over 99.5 (Both Teams Total Points). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.

- **-120** ORL Magic @ TOR Raptors, Oct 30, 7:40 PM ET
  - TOR Raptors (Moneyline). Magic at Raptors. Models: Raptors, 4–0. Sim: 99–118.5, Raptors 100%, thin. Venue-matched score 100.3–123.8.
  - Over 99.5 (Both Teams Total Points). Magic at Raptors is on a retrieved slate. No projection is attached to this market.

- **+194** ORL Magic @ TOR Raptors, Oct 30, 7:40 PM ET
  - TOR Raptors (Moneyline). Magic at Raptors. Models: Raptors, 4–0. Sim: 99–118.5, Raptors 100%, thin. Venue-matched score 100.3–123.8.
  - Over 116.5 (TOR Raptors: Team Total Points). Magic at Raptors. Venue-matched home score 123.8. Book team total 116.5.
  - Over 227.5 (Total). Magic at Raptors. Venue-matched total 224. Book number 227.5.

- **-275** CHI Bulls @ BOS Celtics, Oct 30, 7:40 PM ET
  - BOS Celtics (Moneyline). Bulls at Celtics. Models: Celtics, 4–0. Sim: 108–129.5, Celtics 94.9%. Venue-matched score 108.2–126.7.
  - Over 99.5 (Both Teams Total Points). Bulls at Celtics is on a retrieved slate. No projection is attached to this market.

- **+140** CHI Bulls @ BOS Celtics, Oct 30, 7:40 PM ET
  - BOS Celtics (Moneyline). Bulls at Celtics. Models: Celtics, 4–0. Sim: 108–129.5, Celtics 94.9%. Venue-matched score 108.2–126.7.
  - Over 125.5 (BOS Celtics: Team Total Points). Bulls at Celtics. Venue-matched home score 126.7. Book team total 125.5.
  - Over 235.5 (Total). Bulls at Celtics. Venue-matched total 234.8. Book number 235.5.

- **+190** CHI Bulls @ BOS Celtics, Oct 30, 7:40 PM ET
  - BOS Celtics (Moneyline). Bulls at Celtics. Models: Celtics, 4–0. Sim: 108–129.5, Celtics 94.9%. Venue-matched score 108.2–126.7.
  - Under 125.5 (BOS Celtics: Team Total Points). Bulls at Celtics. Venue-matched home score 126.7. Book team total 125.5.
  - Under 235.5 (Total). Bulls at Celtics. Venue-matched total 234.8. Book number 235.5.

- **-105** DET Pistons @ BKN Nets, Oct 30, 7:40 PM ET
  - DET Pistons (Moneyline). Pistons at Nets. Models: Pistons, 4–0. Sim: 119–107, Pistons 84.8%, thin. Venue-matched score 116.7–105.5.
  - Over 99.5 (Both Teams Total Points). Pistons at Nets is on a retrieved slate. No projection is attached to this market.

- **+178** DET Pistons @ BKN Nets, Oct 30, 7:40 PM ET
  - DET Pistons (Moneyline). Pistons at Nets. Models: Pistons, 4–0. Sim: 119–107, Pistons 84.8%, thin. Venue-matched score 116.7–105.5.
  - Over 115.5 (DET Pistons: Team Total Points). Pistons at Nets. Venue-matched away score 116.7. Book team total 115.5.
  - Over 222.5 (Total). Pistons at Nets. Venue-matched total 222.2. Book number 222.5.

- **+160** IND Pacers @ MIA Heat, Oct 30, 8:10 PM ET
  - MIA Heat (Moneyline). Pacers at Heat. Models: Pacers, 4–0. Sim: 124.5–110, Pacers 88.5%. Venue-matched score 122.2–110.8.
  - Over 122.5 (MIA Heat: Team Total Points). Pacers at Heat. Venue-matched home score 110.8. Book team total 122.5.
  - Over 236.5 (Total). Pacers at Heat. Venue-matched total 233. Book number 236.5.

- **-110** HOU Rockets @ DAL Mavericks, Oct 30, 8:10 PM ET
  - HOU Rockets (Moneyline). Rockets at Mavericks. Models: Rockets, 4–0. Sim: 114–110, Rockets 68.8%, thin. Venue-matched score 115.7–110.5.
  - Over 99.5 (Both Teams Total Points). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.

- **+180** HOU Rockets @ DAL Mavericks, Oct 30, 8:10 PM ET
  - HOU Rockets (Moneyline). Rockets at Mavericks. Models: Rockets, 4–0. Sim: 114–110, Rockets 68.8%, thin. Venue-matched score 115.7–110.5.
  - Over 115.5 (HOU Rockets: Team Total Points). Rockets at Mavericks. Venue-matched away score 115.7. Book team total 115.5.
  - Over 223.5 (Total). Rockets at Mavericks. Venue-matched total 226.2. Book number 223.5.

- **-110** LA Clippers @ MIN Timberwolves, Oct 30, 8:10 PM ET
  - MIN Timberwolves (Moneyline). Clippers at Timberwolves. Models: Timberwolves, 4–0. Sim: 110–119.5, Timberwolves 88.1%, thin. Venue-matched score 107.8–116.
  - Over 99.5 (Both Teams Total Points). Clippers at Timberwolves is on a retrieved slate. No projection is attached to this market.

- **+170** LA Clippers @ MIN Timberwolves, Oct 30, 8:10 PM ET
  - MIN Timberwolves (Moneyline). Clippers at Timberwolves. Models: Timberwolves, 4–0. Sim: 110–119.5, Timberwolves 88.1%, thin. Venue-matched score 107.8–116.
  - Over 114.5 (MIN Timberwolves: Team Total Points). Clippers at Timberwolves. Venue-matched home score 116. Book team total 114.5.
  - Over 222.5 (Total). Clippers at Timberwolves. Venue-matched total 223.8. Book number 222.5.

- **-120** DEN Nuggets @ PHO Suns, Oct 30, 10:10 PM ET
  - DEN Nuggets (Moneyline). Nuggets at Suns. Models: split, 2–2. Sim: 103–111, Suns 75.4%, thin. Venue-matched score 108–112.3.
  - Over 99.5 (Both Teams Total Points). Nuggets at Suns is on a retrieved slate. No projection is attached to this market.

- **+162** DEN Nuggets @ PHO Suns, Oct 30, 10:10 PM ET
  - PHO Suns (Moneyline). Nuggets at Suns. Models: split, 2–2. Sim: 103–111, Suns 75.4%, thin. Venue-matched score 108–112.3.
  - Over 99.5 (Both Teams Total Points). Nuggets at Suns is on a retrieved slate. No projection is attached to this market.

- **+180** WPG Jets @ FLA Panthers, Oct 30, 7:10 PM ET
  - FLA Panthers (Moneyline). Jets at Panthers. Models: split, 3–1 Panthers. Sim: 3–3.5, Panthers 54.8%. Venue-matched score 2.8–3.6.
  - FLA Panthers (Moneyline 1st Period). Jets at Panthers is on a retrieved slate. No projection is attached to this market.
  - FLA Panthers (1st Goal (Excl OT)). Jets at Panthers is on a retrieved slate. No projection is attached to this market.

- **+184** CHI Blackhawks @ BOS Bruins, Oct 31, 1:10 PM ET
  - BOS Bruins (Moneyline). Game is not on a retrieved slate.
  - BOS Bruins (Moneyline 1st Period). Game is not on a retrieved slate.
  - BOS Bruins (1st Goal (Excl OT)). Game is not on a retrieved slate.

- **+124** CGY Flames @ COL Avalanche, Oct 31, 10:10 PM ET
  - COL Avalanche (Moneyline). Game is not on a retrieved slate.
  - COL Avalanche (Moneyline 1st Period). Game is not on a retrieved slate.
  - COL Avalanche (1st Goal (Excl OT)). Game is not on a retrieved slate.

- **+196** CGY Flames @ COL Avalanche, Oct 31, 10:10 PM ET
  - COL Avalanche (Moneyline). Game is not on a retrieved slate.
  - COL Avalanche (Moneyline 1st Period). Game is not on a retrieved slate.
  - Over 4.5 (COL Avalanche: Team Total Goals). Game is not on a retrieved slate.

- **+162** Bowling Green @ Western Michigan, Oct 31, 12:00 PM ET
  - Western Michigan (Moneyline). Bowling Green at W Michigan. Models: W Michigan, 4–0. Sim: 15.5–34.5, W Michigan 91%. Venue-matched score 16.6–35.9.
  - Western Michigan (Moneyline 1st Quarter). Bowling Green at W Michigan is on a retrieved slate. No projection is attached to this market.
  - Over 44.5 (Total). Bowling Green at W Michigan. Venue-matched total 52.5. Book number 44.5.

- **+180** Auburn @ Ole Miss, Oct 31, 12:45 PM ET
  - Ole Miss (Moneyline). Auburn at #12 Ole Miss. Models: #12 Ole Miss, 4–0. Sim: 15–28, #12 Ole Miss 100%, thin. Venue-matched score 16.3–29.3.
  - Ole Miss (Moneyline 1st Quarter). Auburn at #12 Ole Miss is on a retrieved slate. No projection is attached to this market.
  - Over 57.5 (Total). Auburn at #12 Ole Miss. Venue-matched total 45.6. Book number 57.5.

- **+124** Stanford @ Louisville, Oct 31, 3:15 PM ET
  - Louisville (Moneyline). Stanford at Louisville. Models: Louisville, 4–0. Sim: 16.5–49, Louisville 100%. Venue-matched score 14.6–46.4.
  - Louisville (Moneyline 1st Quarter). Stanford at Louisville is on a retrieved slate. No projection is attached to this market.
  - Over 60.5 (Total). Stanford at Louisville. Venue-matched total 61. Book number 60.5.

- **+186** Florida @ Georgia, Oct 31, 3:30 PM ET
  - Georgia Bulldogs (Moneyline). #17 Florida at #3 Georgia. Models: #3 Georgia, 4–0. Sim: 22–41.5, #3 Georgia 94.6%. Venue-matched score 22.4–41.6.
  - Georgia Bulldogs (Moneyline 1st Quarter). #17 Florida at #3 Georgia is on a retrieved slate. No projection is attached to this market.
  - Over 56.5 (Total). #17 Florida at #3 Georgia. Venue-matched total 64. Book number 56.5.

- **+164** FIU @ Liberty, Oct 31, 3:30 PM ET
  - Liberty (Moneyline). FIU at Liberty. Models: Liberty, 4–0. Sim: 13.5–27, Liberty 97.6%. Venue-matched score 14–28.7.
  - Liberty (Moneyline 1st Quarter). FIU at Liberty is on a retrieved slate. No projection is attached to this market.
  - Over 45.5 (Total). FIU at Liberty. Venue-matched total 42.7. Book number 45.5.

- **+118** Minnesota @ Indiana, Oct 31, 3:30 PM ET
  - Indiana (Moneyline). Minnesota at #4 Indiana. Models: #4 Indiana, 4–0. Sim: 14.5–35, #4 Indiana 96.7%, thin. Venue-matched score 15.8–35.2.
  - Indiana (Moneyline 1st Quarter). Minnesota at #4 Indiana is on a retrieved slate. No projection is attached to this market.
  - Over 40.5 (Total). Minnesota at #4 Indiana. Venue-matched total 51. Book number 40.5.

- **+156** Arizona State @ BYU, Oct 31, 3:30 PM ET
  - BYU (Moneyline). Arizona St at #8 BYU. Models: #8 BYU, 4–0. Sim: 18.5–40.5, #8 BYU 100%, thin. Venue-matched score 18.5–43.1.
  - BYU (Moneyline 1st Quarter). Arizona St at #8 BYU is on a retrieved slate. No projection is attached to this market.
  - Over 48.5 (Total). Arizona St at #8 BYU. Venue-matched total 61.6. Book number 48.5.

- **+180** Virginia @ Wake Forest, Oct 31, 3:45 PM ET
  - Wake Forest (Moneyline). Virginia at #14 Wake Forest. Models: #14 Wake Forest, 4–0. Sim: 14.5–38, #14 Wake Forest 97.5%, thin. Venue-matched score 13.7–34.4.
  - Wake Forest (Moneyline 1st Quarter). Virginia at #14 Wake Forest is on a retrieved slate. No projection is attached to this market.
  - Over 48.5 (Total). Virginia at #14 Wake Forest. Venue-matched total 48.1. Book number 48.5.

- **+186** Purdue @ Penn State, Oct 31, 4:15 PM ET
  - Penn State (Moneyline). Purdue at Penn State. Models: split, 3–1 Penn State. Sim: 25.5–36, Penn State 77.4%, thin. Venue-matched score 24–35.1.
  - Penn State (Moneyline 1st Quarter). Purdue at Penn State is on a retrieved slate. No projection is attached to this market.
  - Over 54.5 (Total). Purdue at Penn State. Venue-matched total 59.1. Book number 54.5.

- **+118** Nevada @ UCLA, Oct 31, 4:15 PM ET
  - UCLA (Moneyline). Nevada at #7 UCLA. Models: #7 UCLA, 4–0. Sim: 18.5–27.5, #7 UCLA 80%. Venue-matched score 19.3–27.5.
  - UCLA (Moneyline 1st Quarter). Nevada at #7 UCLA is on a retrieved slate. No projection is attached to this market.
  - Over 43.5 (Total). Nevada at #7 UCLA. Venue-matched total 46.8. Book number 43.5.

- **+122** Mississippi State @ Texas, Oct 31, 7:30 PM ET
  - Texas (Moneyline). Mississippi St at #11 Texas. Models: split, 3–1 #11 Texas. Sim: 23.5–29, #11 Texas 64.6%. Venue-matched score 22.2–30.1.
  - Texas (Moneyline 1st Quarter). Mississippi St at #11 Texas is on a retrieved slate. No projection is attached to this market.
  - Over 50.5 (Total). Mississippi St at #11 Texas. Venue-matched total 52.3. Book number 50.5.

- **+196** Texas State @ Boise State, Oct 31, 10:00 PM ET
  - Boise State (Moneyline). Texas St at #20 Boise St. Models: #20 Boise St, 4–0. Sim: 15.5–48, #20 Boise St 100%, thin. Venue-matched score 19.3–41.3.
  - Boise State (Moneyline 1st Quarter). Texas St at #20 Boise St is on a retrieved slate. No projection is attached to this market.
  - Over 63.5 (Total). Texas St at #20 Boise St. Venue-matched total 60.7. Book number 63.5.

- **+120** Northern Illinois @ UNLV, Oct 31, 10:30 PM ET
  - UNLV (Moneyline). Game is not on a retrieved slate.
  - UNLV (Moneyline 1st Quarter). Game is not on a retrieved slate.
  - Over 54.5 (Total). Game is not on a retrieved slate.

- **+1052** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Score Four: These players find a way into the end zone
  - Derrick Henry (Any Time Touchdown Scorer). Player projection missing.
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.
  - James Cook (Any Time Touchdown Scorer). Player projection missing.
  - Zay Flowers (Any Time Touchdown Scorer). Player projection missing.

- **+1757** Arizona Cardinals @ Dallas Cowboys, Nov 1, 1:01 PM ET
  - Double Trouble: Lamb & Pickens each top 100 receiving yards and find the end zone
  - CeeDee Lamb 100+ Yards (CeeDee Lamb - Alt Receiving Yds). Player projection missing.
  - George Pickens 100+ Yards (George Pickens - Alt Receiving Yds). Player projection missing.
  - CeeDee Lamb (Any Time Touchdown Scorer). Player projection missing.
  - George Pickens (Any Time Touchdown Scorer). Player projection missing.

- **+4172** Los Angeles Chargers @ Los Angeles Rams, Nov 1, 4:06 PM ET
  - Hollywood Endings: Back these four playmakers to put on a scoring show
  - Kyren Williams (Any Time Touchdown Scorer). Player projection missing.
  - Puka Nacua (Any Time Touchdown Scorer). Player projection missing.
  - Omarion Hampton (Any Time Touchdown Scorer). Player projection missing.
  - Ladd McConkey (Any Time Touchdown Scorer). Player projection missing.

- **+1023** Atlanta Falcons @ Tampa Bay Buccaneers, Nov 1, 1:01 PM ET
  - Ground & Pound: Bijan & Bucky look to run wild, haul in catches & score TDs apiece
  - Bijan Robinson (Any Time Touchdown Scorer). Player projection missing.
  - Bucky Irving (Any Time Touchdown Scorer). Player projection missing.
  - Bijan Robinson 70+ Yards (Bijan Robinson - Alt Rushing Yds). Player projection missing.
  - Bucky Irving 60+ Yards (Bucky Irving - Alt Rushing Yds). Player projection missing.
  - Bijan Robinson 4+ Receptions (Bijan Robinson - Alt Receptions). Player projection missing.
  - Bucky Irving 2+ Receptions (Bucky Irving - Alt Receptions). Player projection missing.

- **+1084** Tennessee Titans @ Cincinnati Bengals, Nov 1, 1:01 PM ET
  - Double Trouble: Chase & Gesicki hunt TDs while piling up catches against Tennessee
  - Ja'Marr Chase (Any Time Touchdown Scorer). Player projection missing.
  - Mike Gesicki (Any Time Touchdown Scorer). Player projection missing.
  - Ja'Marr Chase 80+ Yards (Ja'Marr Chase - Alt Receiving Yds). Player projection missing.
  - Mike Gesicki 3+ Receptions (Mike Gesicki - Alt Receptions). Player projection missing.
  - Ja'Marr Chase 5+ Receptions (Ja'Marr Chase - Alt Receptions). Player projection missing.

- **+749** New England Patriots @ Miami Dolphins, Nov 1, 4:26 PM ET
  - Pats Party in Miami: Maye throws for 250+ & 2+ TDs, Stevenson rushes for 50+ & scores
  - Drake Maye 250+ Yards (Drake Maye - Alt Passing Yds). Player projection missing.
  - Drake Maye 2+ Passing Touchdowns (Drake Maye - Alt Passing TDs). Player projection missing.
  - Rhamondre Stevenson 50+ Yards (Rhamondre Stevenson - Alt Rushing Yds). Player projection missing.
  - Rhamondre Stevenson (Any Time Touchdown Scorer). Player projection missing.

- **+682** Kansas City Chiefs @ Denver Broncos, Nov 1, 4:26 PM ET
  - Take the NFL GameCenter's SGP for Chiefs-Broncos!
  - Patrick Mahomes 175+ Yards (Patrick Mahomes - Alt Passing Yds). Player projection missing.
  - Travis Kelce (Any Time Touchdown Scorer). Player projection missing.
  - Under (49.5) (Alternate Total Points). Chiefs at Broncos is on a retrieved slate. No projection is attached to this market.
  - Kenneth Walker III 60+ Yards (Kenneth Walker III - Alt Rushing Yds). Player projection missing.

- **+912** Kansas City Chiefs @ Denver Broncos, Nov 1, 4:26 PM ET
  - Running the Show: Kenneth Walker III returns to MVP form with 125+ rushing yards & 2+ TDs
  - Kenneth Walker III 125+ Yards (Kenneth Walker III - Alt Rushing Yds). Player projection missing.
  - Kenneth Walker III (To Score 2+ Touchdowns). Player projection missing.

- **+446** Philadelphia Eagles @ Washington Commanders, Nov 1, 8:21 PM ET
  - Back the NFL GameCenter SGP for this Week 8 matchup on SNF!
  - Over (34.5) (Alternate Total Points). Eagles at Commanders is on a retrieved slate. No projection is attached to this market.
  - Saquon Barkley (Any Time Touchdown Scorer). Player projection missing.
  - Jayden Daniels 25+ Yards (Jayden Daniels - Alt Rushing Yds). Player projection missing.
  - Stefon Diggs 4+ Receptions (Stefon Diggs - Alt Receptions). Player projection missing.

- **+695** Cleveland Browns @ Pittsburgh Steelers, Nov 1, 1:01 PM ET
  - Carrying The Team: Both starting RBs go for 70+ rush yards
  - Quinshon Judkins 70+ Yards (Quinshon Judkins - Alt Rushing Yds). Player projection missing.
  - Jaylen Warren 70+ Yards (Jaylen Warren - Alt Rushing Yds). Player projection missing.

- **+810** Minnesota Vikings @ Detroit Lions, Nov 1, 1:01 PM ET
  - Jahmyr Gibbs (Any Time Touchdown Scorer). Player projection missing.
  - Amon-Ra St. Brown (Any Time Touchdown Scorer). Player projection missing.
  - Justin Jefferson (Any Time Touchdown Scorer). Player projection missing.

- **+1346** Las Vegas Raiders @ New York Jets, Nov 1, 1:01 PM ET
  - Brock Bowers 100+ Yards (Brock Bowers - Alt Receiving Yds). Player projection missing.
  - Garrett Wilson 100+ Yards (Garrett Wilson - Alt Receiving Yds). Player projection missing.

- **+4481** Minnesota Vikings @ Detroit Lions, Nov 1, 1:01 PM ET
  - Justin Jefferson (Any Time Touchdown Scorer). Player projection missing.
  - Jahmyr Gibbs (Any Time Touchdown Scorer). Player projection missing.
  - Jordan Addison (Any Time Touchdown Scorer). Player projection missing.
  - Jameson Williams (Any Time Touchdown Scorer). Player projection missing.

- **+3766** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Derrick Henry (Any Time Touchdown Scorer). Player projection missing.
  - Zay Flowers (Any Time Touchdown Scorer). Player projection missing.
  - D.J. Moore (Any Time Touchdown Scorer). Player projection missing.
  - James Cook (Any Time Touchdown Scorer). Player projection missing.
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.

- **+456** Las Vegas Raiders @ New York Jets, Nov 1, 1:01 PM ET
  - Brock Bowers 80+ Yards (Brock Bowers - Alt Receiving Yds). Player projection missing.
  - Garrett Wilson 80+ Yards (Garrett Wilson - Alt Receiving Yds). Player projection missing.

- **+3166** Minnesota Vikings @ Detroit Lions, Nov 1, 1:01 PM ET
  - Jahmyr Gibbs (Any Time Touchdown Scorer). Player projection missing.
  - Amon-Ra St. Brown (Any Time Touchdown Scorer). Player projection missing.
  - Justin Jefferson (Any Time Touchdown Scorer). Player projection missing.
  - Aaron Jones (Any Time Touchdown Scorer). Player projection missing.

- **+371** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.
  - Derrick Henry (Any Time Touchdown Scorer). Player projection missing.
  - James Cook (Any Time Touchdown Scorer). Player projection missing.

- **+1960** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Lamar Jackson (Any Time Touchdown Scorer). Player projection missing.
  - James Cook (Any Time Touchdown Scorer). Player projection missing.
  - Derrick Henry (Any Time Touchdown Scorer). Player projection missing.
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.

- **+1399** Tennessee Titans @ Cincinnati Bengals, Nov 1, 1:01 PM ET
  - Ja'Marr Chase (Any Time Touchdown Scorer). Player projection missing.
  - Mike Gesicki (Any Time Touchdown Scorer). Player projection missing.
  - Tee Higgins (Any Time Touchdown Scorer). Player projection missing.

- **+509** Chicago Bears @ Seattle Seahawks, Nov 2, 8:16 PM ET
  - Luther Burden III (Any Time Touchdown Scorer). Player projection missing.
  - Jaxon Smith-Njigba (Any Time Touchdown Scorer). Player projection missing.

- **+3510** Kansas City Chiefs @ Denver Broncos, Nov 1, 4:26 PM ET
  - Patrick Mahomes (Any Time Touchdown Scorer). Player projection missing.
  - Bo Nix (Any Time Touchdown Scorer). Player projection missing.

- **+1062** Arizona Cardinals @ Dallas Cowboys, Nov 1, 1:01 PM ET
  - CeeDee Lamb (Any Time Touchdown Scorer). Player projection missing.
  - Javonte Williams (Any Time Touchdown Scorer). Player projection missing.
  - George Pickens (Any Time Touchdown Scorer). Player projection missing.
  - Trey McBride (Any Time Touchdown Scorer). Player projection missing.

- **+509** Minnesota Vikings @ Detroit Lions, Nov 1, 1:01 PM ET
  - Amon-Ra St. Brown (Any Time Touchdown Scorer). Player projection missing.
  - Justin Jefferson (Any Time Touchdown Scorer). Player projection missing.

- **+1455** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Derrick Henry (To Score 2+ Touchdowns). Player projection missing.
  - Josh Allen (To Score 2+ Touchdowns). Player projection missing.

- **+886** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Lamar Jackson 2+ Passing Touchdowns (Lamar Jackson - Alt Passing TDs). Player projection missing.
  - Derrick Henry 50+ Yards (Derrick Henry - Alt Rushing Yds). Player projection missing.
  - Ja'Kobi Lane 40+ Yards (Ja'Kobi Lane - Alt Receiving Yds). Player projection missing.
  - Zay Flowers 100+ Yards (Zay Flowers - Alt Receiving Yds). Player projection missing.

- **+1176** Chicago Bears @ Seattle Seahawks, Nov 2, 8:16 PM ET
  - D'Andre Swift (Any Time Touchdown Scorer). Player projection missing.
  - Jaxon Smith-Njigba (Any Time Touchdown Scorer). Player projection missing.
  - Colston Loveland (Any Time Touchdown Scorer). Player projection missing.

- **+2920** Arizona Cardinals @ Dallas Cowboys, Nov 1, 1:01 PM ET
  - Javonte Williams (Any Time Touchdown Scorer). Player projection missing.
  - CeeDee Lamb (Any Time Touchdown Scorer). Player projection missing.
  - Trey McBride (Any Time Touchdown Scorer). Player projection missing.
  - George Pickens (Any Time Touchdown Scorer). Player projection missing.
  - Jeremiyah Love (Any Time Touchdown Scorer). Player projection missing.

- **+286** Chicago Bears @ Seattle Seahawks, Nov 2, 8:16 PM ET
  - Chicago Bears (Moneyline). Bears at Seahawks. Models: Seahawks, 4–0. Sim: 20.5–26.5, Seahawks 55.9%. Venue-matched score 24.7–26.7.
  - Caleb Williams Over 227.5 (Caleb Williams - Passing Yds). Player projection missing.

- **+1140** Minnesota Vikings @ Detroit Lions, Nov 1, 1:01 PM ET
  - Jahmyr Gibbs (Any Time Touchdown Scorer). Player projection missing.
  - Amon-Ra St. Brown (Any Time Touchdown Scorer). Player projection missing.
  - Justin Jefferson (Any Time Touchdown Scorer). Player projection missing.
  - Detroit Lions (Moneyline). Vikings at Lions. Models: split, 3–1 Vikings. Sim: 20–18, Vikings 61.3%. Venue-matched score 21–19.

- **+1658** Arizona Cardinals @ Dallas Cowboys, Nov 1, 1:01 PM ET
  - CeeDee Lamb 150+ Yards (CeeDee Lamb - Alt Receiving Yds). Player projection missing.
  - CeeDee Lamb (To Score 2+ Touchdowns). Player projection missing.

- **+657** Indianapolis Colts @ Jacksonville Jaguars, Nov 1, 1:01 PM ET
  - Chris Rodriguez Jr. (Any Time Touchdown Scorer). Player projection missing.
  - Chris Rodriguez Jr. 50+ Yards (Chris Rodriguez Jr. - Alt Rushing Yds). Player projection missing.

- **+311** Tennessee Titans @ Cincinnati Bengals, Nov 1, 1:01 PM ET
  - Ja'Marr Chase (Any Time Touchdown Scorer). Player projection missing.
  - Tee Higgins (Any Time Touchdown Scorer). Player projection missing.

- **+2720** Chicago Bears @ Seattle Seahawks, Nov 2, 8:16 PM ET
  - D'Andre Swift (Any Time Touchdown Scorer). Player projection missing.
  - Luther Burden III (Any Time Touchdown Scorer). Player projection missing.
  - Colston Loveland (Any Time Touchdown Scorer). Player projection missing.

- **+3255** Tennessee Titans @ Cincinnati Bengals, Nov 1, 1:01 PM ET
  - Ja'Marr Chase (Any Time Touchdown Scorer). Player projection missing.
  - Mike Gesicki (Any Time Touchdown Scorer). Player projection missing.
  - Tee Higgins (Any Time Touchdown Scorer). Player projection missing.
  - Chase Brown (Any Time Touchdown Scorer). Player projection missing.

- **+548** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Lamar Jackson (Any Time Touchdown Scorer). Player projection missing.
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.

- **+283** Chicago Bears @ Seattle Seahawks, Nov 2, 8:16 PM ET
  - Jaxon Smith-Njigba (Any Time Touchdown Scorer). Player projection missing.
  - D'Andre Swift (Any Time Touchdown Scorer). Player projection missing.

- **+1919** Kansas City Chiefs @ Denver Broncos, Nov 1, 4:26 PM ET
  - Kenneth Walker III (Any Time Touchdown Scorer). Player projection missing.
  - J.K. Dobbins (Any Time Touchdown Scorer). Player projection missing.
  - Travis Kelce (Any Time Touchdown Scorer). Player projection missing.

- **+348** Cleveland Browns @ Pittsburgh Steelers, Nov 1, 1:01 PM ET
  - Quinshon Judkins (Any Time Touchdown Scorer). Player projection missing.
  - Jaylen Warren (Any Time Touchdown Scorer). Player projection missing.

- **+2364** Philadelphia Eagles @ Washington Commanders, Nov 1, 8:21 PM ET
  - Saquon Barkley (Any Time Touchdown Scorer). Player projection missing.
  - Stefon Diggs (Any Time Touchdown Scorer). Player projection missing.
  - Dallas Goedert (Any Time Touchdown Scorer). Player projection missing.

- **+281** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Buffalo Bills (Moneyline). Ravens at Bills. Models: split, 2–2. Sim: 28.5–24.5, Ravens 55.9%. Venue-matched score 26.2–25.
  - James Cook (Any Time Touchdown Scorer). Player projection missing.
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.

- **+208** Atlanta Falcons @ Tampa Bay Buccaneers, Nov 1, 1:01 PM ET
  - Bucky Irving (Any Time Touchdown Scorer). Player projection missing.
  - Bijan Robinson (Any Time Touchdown Scorer). Player projection missing.

- **+533** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.
  - James Cook (Any Time Touchdown Scorer). Player projection missing.
  - Derrick Henry (Any Time Touchdown Scorer). Player projection missing.
  - Buffalo Bills (Moneyline). Ravens at Bills. Models: split, 2–2. Sim: 28.5–24.5, Ravens 55.9%. Venue-matched score 26.2–25.

- **+419** Arizona Cardinals @ Dallas Cowboys, Nov 1, 1:01 PM ET
  - Trey McBride (Any Time Touchdown Scorer). Player projection missing.
  - CeeDee Lamb (Any Time Touchdown Scorer). Player projection missing.
  - Javonte Williams (Any Time Touchdown Scorer). Player projection missing.

- **+400** Los Angeles Chargers @ Los Angeles Rams, Nov 1, 4:06 PM ET
  - Blake Corum (Any Time Touchdown Scorer). Player projection missing.
  - Kyren Williams (Any Time Touchdown Scorer). Player projection missing.

- **+1188** Minnesota Vikings @ Detroit Lions, Nov 1, 1:01 PM ET
  - Jahmyr Gibbs (Any Time Touchdown Scorer). Player projection missing.
  - Amon-Ra St. Brown (Any Time Touchdown Scorer). Player projection missing.
  - Jameson Williams (Any Time Touchdown Scorer). Player projection missing.

- **+611** Baltimore Ravens @ Buffalo Bills, Nov 1, 1:01 PM ET
  - James Cook (Any Time Touchdown Scorer). Player projection missing.
  - Josh Allen (Any Time Touchdown Scorer). Player projection missing.
  - Zay Flowers (Any Time Touchdown Scorer). Player projection missing.

- **+228** Minnesota Vikings @ Detroit Lions, Nov 1, 1:01 PM ET
  - Detroit Lions (Moneyline). Vikings at Lions. Models: split, 3–1 Vikings. Sim: 20–18, Vikings 61.3%. Venue-matched score 21–19.
  - Amon-Ra St. Brown (Any Time Touchdown Scorer). Player projection missing.

- **+517** Tennessee Titans @ Cincinnati Bengals, Nov 1, 1:01 PM ET
  - Ja'Marr Chase (Any Time Touchdown Scorer). Player projection missing.
  - Mike Gesicki (Any Time Touchdown Scorer). Player projection missing.

- **+1488** Cleveland Browns @ Pittsburgh Steelers, Nov 1, 1:01 PM ET
  - Darnell Washington (Any Time Touchdown Scorer). Player projection missing.
  - KC Concepcion (Any Time Touchdown Scorer). Player projection missing.

- **+839** New England Patriots @ Miami Dolphins, Nov 1, 4:26 PM ET
  - Rhamondre Stevenson (Any Time Touchdown Scorer). Player projection missing.
  - Ollie Gordon II (Any Time Touchdown Scorer). Player projection missing.
  - Drake Maye 200+ Yards (Drake Maye - Alt Passing Yds). Player projection missing.
  - Malik Willis 175+ Yards (Malik Willis - Alt Passing Yds). Player projection missing.
  - Hunter Henry 25+ Yards (Hunter Henry - Alt Receiving Yds). Player projection missing.

- **+204** Florida @ Georgia, Oct 31, 3:30 PM ET
  - Georgia (Moneyline). #17 Florida at #3 Georgia. Models: #3 Georgia, 4–0. Sim: 22–41.5, #3 Georgia 94.6%. Venue-matched score 22.4–41.6.
  - Florida 11.5 (Spread). #17 Florida at #3 Georgia is on a retrieved slate. No projection is attached to this market.

- **+1651** Baylor @ UCF, Oct 30, 7:30 PM ET
  - UCF (Moneyline). Baylor at UCF. Models: split, 2–2. Sim: 30.5–32, UCF 61.7%, thin. Venue-matched score 29.8–33.1.
  - Tie (1st Half Winner (3-Way)). Baylor at UCF is on a retrieved slate. No projection is attached to this market.

- **+228** Florida @ Georgia, Oct 31, 3:30 PM ET
  - Florida 11.5 (Spread). #17 Florida at #3 Georgia is on a retrieved slate. No projection is attached to this market.
  - Over (55.5) (Alternate Total Points). #17 Florida at #3 Georgia is on a retrieved slate. No projection is attached to this market.

- **+431** Florida @ Georgia, Oct 31, 3:30 PM ET
  - Georgia (Moneyline). #17 Florida at #3 Georgia. Models: #3 Georgia, 4–0. Sim: 22–41.5, #3 Georgia 94.6%. Venue-matched score 22.4–41.6.
  - Florida (+10.5) (Alternate Spread). #17 Florida at #3 Georgia is on a retrieved slate. No projection is attached to this market.
  - Under (55.5) (Alternate Total Points). #17 Florida at #3 Georgia is on a retrieved slate. No projection is attached to this market.

- **+271** Baylor @ UCF, Oct 30, 7:30 PM ET
  - UCF (Moneyline). Baylor at UCF. Models: split, 2–2. Sim: 30.5–32, UCF 61.7%, thin. Venue-matched score 29.8–33.1.
  - Under 23.5 (1st Half Total). Baylor at UCF is on a retrieved slate. No projection is attached to this market.

- **+1767** Baylor @ UCF, Oct 30, 7:30 PM ET
  - Baylor (Moneyline). Baylor at UCF. Models: split, 2–2. Sim: 30.5–32, UCF 61.7%, thin. Venue-matched score 29.8–33.1.
  - UCF 2.5 (Spread). Baylor at UCF is on a retrieved slate. No projection is attached to this market.

- **+242** Baylor @ UCF, Oct 30, 7:30 PM ET
  - Punt (UCF Drive 1 - Result). Baylor at UCF is on a retrieved slate. No projection is attached to this market.
  - Punt (Baylor Drive 1  - Result). Baylor at UCF is on a retrieved slate. No projection is attached to this market.

- **+2839** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Talk Is Cheap: Lendeborg and Luka both drop 30 & 8 in a Bay Area Beef
  - Luka Doncic (30+ Points). Player projection missing.
  - Yaxel Lendeborg (30+ Points). Player projection missing.
  - Luka Doncic (8+ Rebounds). Player projection missing.
  - Yaxel Lendeborg (8+ Rebounds). Player projection missing.

- **+440** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Back Blake Griffin's Lakers-Warriors SGP on Prime!
  - Yaxel Lendeborg (15+ Points). Player projection missing.
  - Stephen Curry (20+ Points). Player projection missing.
  - Luka Doncic (35+ Points). Player projection missing.
  - Luka Doncic (8+ Assists). Player projection missing.

- **+1873** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - Joel Embiid (6+ Assists). Player projection missing.
  - Karl-Anthony Towns (6+ Assists). Player projection missing.

- **+4843** Los Angeles Clippers @ Minnesota Timberwolves, Oct 30, 8:10 PM ET
  - Ayo Dosunmu (8+ Assists). Player projection missing.
  - Ayo Dosunmu (8+ Rebounds). Player projection missing.

- **+3999** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - OG Anunoby (2+ Threes). Player projection missing.
  - Tyrese Maxey (2+ Threes). Player projection missing.
  - Jalen Brunson (2+ Threes). Player projection missing.
  - Mikal Bridges (1+ Threes). Player projection missing.
  - LeBron James (1+ Threes). Player projection missing.
  - Karl-Anthony Towns (2+ Threes). Player projection missing.
  - Landry Shamet (3+ Threes). Player projection missing.

- **+640** Los Angeles Clippers @ Minnesota Timberwolves, Oct 30, 8:10 PM ET
  - Ayo Dosunmu (6+ Rebounds). Player projection missing.
  - Ayo Dosunmu (6+ Assists). Player projection missing.

- **+3327** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - Sion James (6+ Assists). Player projection missing.
  - Sion James (10+ Points). Player projection missing.

- **+218** Orlando Magic @ Toronto Raptors, Oct 30, 7:40 PM ET
  - Franz Wagner Under 5.5 (Franz Wagner - 1st Qtr Points). Player projection missing.
  - RJ Barrett Under 5.5 (RJ Barrett - 1st Qtr Points). Player projection missing.

- **+213** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - LeBron James Under 4.5 (LeBron James - 1st Qtr Points). Player projection missing.
  - Jalen Brunson Under 7.5 (Jalen Brunson - 1st Qtr Points). Player projection missing.

- **+3922** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - Trae Young Over 32.5 (Trae Young - Pts + Reb + Ast). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.
  - Anthony Davis Over 32.5 (Anthony Davis - Pts + Reb + Ast). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.
  - Kyshawn George Over 21.5 (Kyshawn George - Pts + Reb + Ast). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.
  - Dennis Schroder Over 24.5 (Dennis Schroder - Pts + Reb + Ast). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.
  - Sion James Over 11.5 (Sion James - Pts + Reb + Ast). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.
  - Moussa Diabaté Over 20.5 (Moussa Diabaté - Pts + Reb + Ast). Hornets at Wizards is on a retrieved slate. No projection is attached to this market.

- **+1837** Detroit Pistons @ Brooklyn Nets, Oct 30, 7:40 PM ET
  - Mikel Brown Jr. (6+ Rebounds). Player projection missing.
  - Mikel Brown Jr. (6+ Assists). Player projection missing.

- **+4911** Houston Rockets @ Dallas Mavericks, Oct 30, 8:10 PM ET
  - P.J. Washington Over 21.5 (P.J. Washington - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Amen Thompson Over 30.5 (Amen Thompson - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Daniel Gafford Over 16.5 (Daniel Gafford - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Kevin Durant Over 33.5 (Kevin Durant - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Jabari Smith Over 24.5 (Jabari Smith - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Cooper Flagg Over 35.5 (Cooper Flagg - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.

- **+1076** Indiana Pacers @ Miami Heat, Oct 30, 8:10 PM ET
  - Andrew Nembhard (Player Double Double). Player projection missing.
  - Davion Mitchell (Player Double Double). Player projection missing.

- **+475** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - Joel Embiid Over 24.5 (Joel Embiid - Points). Knicks at 76ers is on a retrieved slate. No projection is attached to this market.
  - OG Anunoby (15+ Points). Player projection missing.
  - VJ Edgecombe (6+ Rebounds). Player projection missing.
  - Josh Hart (6+ Rebounds). Player projection missing.

- **+2619** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - Tyrese Maxey Over 25.5 (Tyrese Maxey - Points). Knicks at 76ers is on a retrieved slate. No projection is attached to this market.
  - Joel Embiid (6+ Assists). Player projection missing.
  - OG Anunoby (20+ Points). Player projection missing.
  - Josh Hart (8+ Rebounds). Player projection missing.

- **+917** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - Landry Shamet (3+ Threes). Player projection missing.
  - Josh Hart (6+ Assists). Player projection missing.

- **+1454** Denver Nuggets @ Phoenix Suns, Oct 30, 10:10 PM ET
  - Trevon Brazile (10+ Rebounds). Player projection missing.
  - Trevon Brazile (10+ Points). Player projection missing.

- **+3750** Chicago Bulls @ Boston Celtics, Oct 30, 7:40 PM ET
  - Derrick White (8+ Assists). Player projection missing.
  - Derrick White (8+ Rebounds). Player projection missing.

- **+1166** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - LeBron James (10+ Assists). Player projection missing.
  - LeBron James (10+ Rebounds). Player projection missing.

- **+3085** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Luka Doncic (40+ Points). Player projection missing.
  - Stephen Curry (40+ Points). Player projection missing.

- **+2221** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Luka Doncic (5+ Threes). Player projection missing.
  - Stephen Curry (4+ Threes). Player projection missing.
  - Austin Reaves (3+ Threes). Player projection missing.
  - Yaxel Lendeborg (2+ Threes). Player projection missing.
  - Sandro Mamukelashvili (1+ Threes). Player projection missing.

- **+583** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - AJ Dybantsa (20+ Points). Player projection missing.
  - Naz Reid (20+ Points). Player projection missing.

- **+1096** Orlando Magic @ Toronto Raptors, Oct 30, 7:40 PM ET
  - Immanuel Quickley (3+ Threes). Player projection missing.
  - Tristan da Silva (3+ Threes). Player projection missing.
  - Franz Wagner (6+ Assists). Player projection missing.
  - Jamal Shead Over 4.5 (Jamal Shead - Assists). Magic at Raptors is on a retrieved slate. No projection is attached to this market.

- **+434** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Yaxel Lendeborg (8+ Rebounds). Player projection missing.
  - Yaxel Lendeborg (25+ Points). Player projection missing.

- **+1802** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - AJ Dybantsa (20+ Points). Player projection missing.
  - Naz Reid (20+ Points). Player projection missing.
  - Moussa Diabaté (12+ Rebounds). Player projection missing.

- **+1090** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Yaxel Lendeborg (15+ Points). Player projection missing.
  - Austin Reaves (20+ Points). Player projection missing.
  - Stephen Curry (25+ Points). Player projection missing.
  - Austin Reaves (2+ Threes). Player projection missing.
  - Luka Doncic (3+ Threes). Player projection missing.
  - Stephen Curry (3+ Threes). Player projection missing.
  - Luka Doncic (40+ Points). Player projection missing.

- **+919** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - Sion James (4+ Assists). Player projection missing.
  - AJ Dybantsa (4+ Assists). Player projection missing.

- **+561** Chicago Bulls @ Boston Celtics, Oct 30, 7:40 PM ET
  - Jayson Tatum (8+ Rebounds). Player projection missing.
  - Paul George (20+ Points). Player projection missing.
  - Derrick White (4+ Rebounds). Player projection missing.
  - Caleb Wilson (15+ Points). Player projection missing.
  - Jalen Smith (5+ Points). Player projection missing.

- **+2395** Denver Nuggets @ Phoenix Suns, Oct 30, 10:10 PM ET
  - Miles Bridges (8+ Rebounds). Player projection missing.
  - Miles Bridges (6+ Assists). Player projection missing.

- **+705** Chicago Bulls @ Boston Celtics, Oct 30, 7:40 PM ET
  - Jayson Tatum (10+ Rebounds). Player projection missing.
  - Jayson Tatum (10+ Assists). Player projection missing.

- **+503** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - Jalen Brunson (30+ Points). Player projection missing.
  - Tyrese Maxey (30+ Points). Player projection missing.

- **+1439** Detroit Pistons @ Brooklyn Nets, Oct 30, 7:40 PM ET
  - Paul Reed (2+ Steals). Pistons at Nets is on a retrieved slate. No projection is attached to this market.
  - Ausar Thompson (6+ Assists). Player projection missing.
  - Paul Reed (15+ Points). Player projection missing.

- **+330** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - Karl-Anthony Towns Over 3.5 (Karl-Anthony Towns - Assists). Knicks at 76ers is on a retrieved slate. No projection is attached to this market.
  - Joel Embiid Over 4.5 (Joel Embiid - Assists). Knicks at 76ers is on a retrieved slate. No projection is attached to this market.

- **+2150** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - AJ Dybantsa (4+ Assists). Player projection missing.
  - AJ Dybantsa (20+ Points). Player projection missing.
  - AJ Dybantsa (6+ Rebounds). Player projection missing.

- **+2875** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - AJ Dybantsa (4+ Assists). Player projection missing.
  - Sion James (6+ Assists). Player projection missing.

- **+1429** Detroit Pistons @ Brooklyn Nets, Oct 30, 7:40 PM ET
  - Ausar Thompson (2+ Steals). Pistons at Nets is on a retrieved slate. No projection is attached to this market.
  - Duncan Robinson (4+ Threes). Player projection missing.
  - Paul Reed (4+ Assists). Player projection missing.

- **+537** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - LeBron James Over 6.5 (LeBron James - Assists). Knicks at 76ers is on a retrieved slate. No projection is attached to this market.
  - VJ Edgecombe (6+ Rebounds). Player projection missing.
  - OG Anunoby (3+ Threes). Player projection missing.

- **+2143** Detroit Pistons @ Brooklyn Nets, Oct 30, 7:40 PM ET
  - Nolan Traore (10+ Points). Player projection missing.
  - Nolan Traore (8+ Assists). Player projection missing.

- **+863** Orlando Magic @ Toronto Raptors, Oct 30, 7:40 PM ET
  - Immanuel Quickley Over 5.5 (Immanuel Quickley - Assists). Magic at Raptors is on a retrieved slate. No projection is attached to this market.
  - Franz Wagner Over 6.5 (Franz Wagner - Assists). Magic at Raptors is on a retrieved slate. No projection is attached to this market.
  - Desmond Bane (3+ Threes). Player projection missing.
  - Ja'Kobe Walter (3+ Threes). Player projection missing.

- **+3327** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Sandro Mamukelashvili (8+ Rebounds). Player projection missing.
  - Sandro Mamukelashvili (3+ Threes). Player projection missing.

- **+3969** Denver Nuggets @ Phoenix Suns, Oct 30, 10:10 PM ET
  - Jalen Green (30+ Points). Player projection missing.
  - Jalen Green (6+ Threes). Player projection missing.

- **+3791** Houston Rockets @ Dallas Mavericks, Oct 30, 8:10 PM ET
  - Dallas Mavericks 6.5 (Spread). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Amen Thompson Over 30.5 (Amen Thompson - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Fred VanVleet Over 21.5 (Fred VanVleet - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Kevin Durant Over 33.5 (Kevin Durant - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.
  - Tari Eason Over 18.5 (Tari Eason - Pts + Reb + Ast). Rockets at Mavericks is on a retrieved slate. No projection is attached to this market.

- **+4163** Charlotte Hornets @ Washington Wizards, Oct 30, 7:10 PM ET
  - Alex Sarr (4+ Assists). Player projection missing.
  - Sion James (6+ Assists). Player projection missing.

- **+3463** Houston Rockets @ Dallas Mavericks, Oct 30, 8:10 PM ET
  - Cooper Flagg (10+ Rebounds). Player projection missing.
  - Cooper Flagg (10+ Assists). Player projection missing.

- **+1852** Chicago Bulls @ Boston Celtics, Oct 30, 7:40 PM ET
  - Jayson Tatum (8+ Assists). Player projection missing.
  - Josh Giddey (8+ Assists). Player projection missing.
  - Jayson Tatum (8+ Rebounds). Player projection missing.
  - Josh Giddey (8+ Rebounds). Player projection missing.

- **+2329** Denver Nuggets @ Phoenix Suns, Oct 30, 10:10 PM ET
  - Collin Gillespie (6+ Rebounds). Player projection missing.
  - Collin Gillespie (6+ Assists). Player projection missing.

- **+793** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Luka Doncic (40+ Points). Player projection missing.
  - Yaxel Lendeborg (25+ Points). Player projection missing.

- **+1485** New York Knicks @ Philadelphia 76ers, Oct 30, 7:40 PM ET
  - Josh Hart (8+ Rebounds). Player projection missing.
  - Josh Hart (8+ Assists). Player projection missing.

- **+1728** Los Angeles Lakers @ Golden State Warriors, Oct 30, 10:10 PM ET
  - Yaxel Lendeborg (30+ Points). Player projection missing.
  - Yaxel Lendeborg (10+ Rebounds). Player projection missing.

- **+1728** Denver Nuggets @ Phoenix Suns, Oct 30, 10:10 PM ET
  - Jalen Green (20+ Points). Player projection missing.
  - Jalen Green (6+ Assists). Player projection missing.

- **+1663** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Eichel (Anytime Goal Scorer). Player projection missing.
  - Jack Hughes (Anytime Goal Scorer). Player projection missing.
  - Mark Stone (Anytime Goal Scorer). Player projection missing.

- **+848** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Brady Tkachuk (2+ Points). Player projection missing.
  - Mark Scheifele (2+ Points). Player projection missing.

- **+799** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Kyle Connor (2+ Points). Player projection missing.
  - Sam Reinhart (2+ Points). Player projection missing.

- **+1068** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Sam Bennett (2+ Shots on Goal). Player projection missing.
  - Cole Perfetti (2+ Shots on Goal). Player projection missing.
  - Seth Jones (3+ Shots on Goal). Player projection missing.
  - Kyle Connor (3+ Shots on Goal). Player projection missing.
  - Matthew Tkachuk (1+ Points). Player projection missing.
  - Brady Tkachuk (1+ Points). Player projection missing.

- **+531** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Hughes (Anytime Goal Scorer). Player projection missing.
  - Jack Eichel (Anytime Goal Scorer). Player projection missing.

- **+1215** Seattle Kraken @ Calgary Flames, Oct 30, 8:10 PM ET
  - Bobby McMann (3+ Shots on Goal). Player projection missing.
  - Jordan Eberle (2+ Shots on Goal). Player projection missing.
  - Joel Farabee (2+ Shots on Goal). Player projection missing.
  - Ryan Strome (2+ Shots on Goal). Player projection missing.
  - Vince Dunn (1+ Points). Player projection missing.

- **+3371** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Sam Bennett (Anytime Goal Scorer). Player projection missing.
  - Cole Perfetti (Anytime Goal Scorer). Player projection missing.
  - Anton Lundell (Anytime Goal Scorer). Player projection missing.

- **+948** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Eichel (2+ Points). Player projection missing.
  - Jesper Bratt (2+ Points). Player projection missing.

- **+1785** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Eichel (Anytime Goal Scorer). Player projection missing.
  - Jack Hughes (Anytime Goal Scorer). Player projection missing.
  - Nico Hischier (Anytime Goal Scorer). Player projection missing.

- **+660** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Mark Stone (Anytime Goal Scorer). Player projection missing.
  - Nico Hischier (Anytime Goal Scorer). Player projection missing.

- **+317** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Matthew Tkachuk (2+ Points). Player projection missing.
  - Brady Tkachuk (2+ Points). Player projection missing.

- **+4565** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Brady Tkachuk (2+ Points). Player projection missing.
  - Mark Scheifele (2+ Points). Player projection missing.
  - Sam Reinhart (2+ Points). Player projection missing.
  - Kyle Connor (2+ Points). Player projection missing.

- **+429** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Hughes (2+ Points). Player projection missing.
  - Jesper Bratt (1+ Points). Player projection missing.
  - Arseny Gritsyuk (1+ Points). Player projection missing.

- **+354** Seattle Kraken @ Calgary Flames, Oct 30, 8:10 PM ET
  - Matt Coronato (1+ Points). Player projection missing.
  - Joel Farabee (1+ Points). Player projection missing.
  - Brandon Montour (1+ Points). Player projection missing.

- **+1041** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jesper Bratt (Anytime Goal Scorer). Player projection missing.
  - Mitchell Marner (Anytime Goal Scorer). Player projection missing.

- **+401** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Matthew Tkachuk (Anytime Goal Scorer). Player projection missing.
  - Brady Tkachuk (Anytime Goal Scorer). Player projection missing.

- **+1213** Seattle Kraken @ Calgary Flames, Oct 30, 8:10 PM ET
  - Mackie Samoskevich (Anytime Goal Scorer). Player projection missing.
  - Yegor Sharangovich (Anytime Goal Scorer). Player projection missing.

- **+600** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Eichel (Anytime Goal Scorer). Player projection missing.
  - Nico Hischier (Anytime Goal Scorer). Player projection missing.

- **+1945** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Eichel (Anytime Goal Scorer). Player projection missing.
  - Mark Stone (Anytime Goal Scorer). Player projection missing.
  - Nico Hischier (Anytime Goal Scorer). Player projection missing.

- **+562** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Hughes (Anytime Goal Scorer). Player projection missing.
  - Mark Stone (Anytime Goal Scorer). Player projection missing.

- **+480** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Sam Reinhart (Anytime Goal Scorer). Player projection missing.
  - Kyle Connor (Anytime Goal Scorer). Player projection missing.

- **+3315** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Brady Tkachuk (Anytime Goal Scorer). Player projection missing.
  - Kyle Connor (Anytime Goal Scorer). Player projection missing.
  - Sam Reinhart (Anytime Goal Scorer). Player projection missing.
  - Matthew Tkachuk (Anytime Goal Scorer). Player projection missing.

- **+439** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Brady Tkachuk (Anytime Goal Scorer). Player projection missing.
  - Kyle Connor (Anytime Goal Scorer). Player projection missing.

- **+607** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - Jack Eichel (2+ Points). Player projection missing.
  - Jack Hughes (2+ Points). Player projection missing.

- **+254** New Jersey Devils @ Vegas Golden Knights, Oct 30, 6:10 PM ET
  - New Jersey Devils (Moneyline). Devils at Golden Knights. Models: split, 3–1 Golden Knights. Sim: 3–4, Golden Knights 73.3%. Venue-matched score 2.7–4.
  - Jack Hughes (Anytime Goal Scorer). Player projection missing.

- **+628** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Brady Tkachuk (1+ Points). Player projection missing.
  - Carter Verhaeghe (1+ Points). Player projection missing.
  - Kyle Connor (1+ Points). Player projection missing.
  - Seth Jones (1+ Points). Player projection missing.
  - Winnipeg Jets +2.5 (Alternate Puck Line). Jets at Panthers is on a retrieved slate. No projection is attached to this market.

- **+1393** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Matthew Tkachuk (3+ Points). Player projection missing.
  - Brady Tkachuk (3+ Points). Player projection missing.

- **+358** Winnipeg Jets @ Florida Panthers, Oct 30, 7:10 PM ET
  - Sam Reinhart (1+ Points). Player projection missing.
  - Carter Verhaeghe (1+ Points). Player projection missing.
  - Mark Scheifele (1+ Points). Player projection missing.
  - Cole Perfetti (1+ Points). Player projection missing.

- **+541** Seattle Kraken @ Calgary Flames, Oct 30, 8:10 PM ET
  - Joel Farabee (Anytime Goal Scorer). Player projection missing.
  - Bobby McMann (Anytime Goal Scorer). Player projection missing.

- **+248** Seattle Kraken @ Calgary Flames, Oct 30, 8:10 PM ET
  - Bobby McMann (1+ Points). Player projection missing.
  - Jordan Eberle (1+ Points). Player projection missing.
  - Matty Beniers (1+ Points). Player projection missing.

## Other priced parlays

These are the remaining cards: cross-game parlays and same-game cards whose event name was not attached. Player legs stay missing.

- **+2881** PARLAY ORGANIC+MANUAL. Atlanta Falcons @ Tampa Bay Buccaneers; Las Vegas Raiders @ New York Jets; Tennessee Titans @ Cincinnati Bengals; Baltimore Ravens @ Buffalo Bills; Arizona Cardinals @ Dallas Cowboys. Red Zone Rewind: Back five Week 7 TD scorers to make another house call Bucky Irving (Any Time Touchdown Scorer) + Ashton Jeanty (Any Time Touchdown Scorer) + Tee Higgins (Any Time Touchdown Scorer) + Zay Flowers (Any Time Touchdown Scorer) + CeeDee Lamb (Any Time Touchdown Scorer)
- **+3401** SGP_PLUS ORGANIC+MANUAL. Minnesota Vikings @ Detroit Lions; Kansas City Chiefs @ Denver Broncos; Los Angeles Chargers @ Los Angeles Rams. Century Club: Four superstars set their sights on 100+ yards leg not attached + Kenneth Walker III 100+ Yards (Kenneth Walker III - Alt Rushing Yds) + Puka Nacua 100+ Yards (Puka Nacua - Alt Receiving Yds)
- **+1445** PARLAY ORGANIC+MANUAL. Minnesota Vikings @ Detroit Lions; Tennessee Titans @ Cincinnati Bengals; Las Vegas Raiders @ New York Jets; Baltimore Ravens @ Buffalo Bills. Catch Flight: Four playmakers take off and rack up receiving yards Jameson Williams 50+ Yards (Jameson Williams - Alt Receiving Yds) + Ja'Marr Chase 80+ Yards (Ja'Marr Chase - Alt Receiving Yds) + Garrett Wilson 80+ Yards (Garrett Wilson - Alt Receiving Yds) + D.J. Moore 50+ Yards (D.J. Moore - Alt Receiving Yds)
- **+620** PARLAY ORGANIC+MANUAL. Tennessee Titans @ Cincinnati Bengals; Arizona Cardinals @ Dallas Cowboys; Las Vegas Raiders @ New York Jets. FanDuel Research's NFL Parlay. Check out fanduel.com/research for more bets Chase Brown (Any Time Touchdown Scorer) + George Pickens 80+ Yards (George Pickens - Alt Receiving Yds) + Garrett Wilson 60+ Yards (Garrett Wilson - Alt Receiving Yds)
- **+675** PARLAY ORGANIC+MANUAL. Minnesota Vikings @ Detroit Lions; Baltimore Ravens @ Buffalo Bills; Los Angeles Chargers @ Los Angeles Rams; Chicago Bears @ Seattle Seahawks. Another Rippin' with the Boys parlay powered by Taylor Lewan! Detroit Lions (Moneyline) + Buffalo Bills (-1.5) (Alternate Spread) + Los Angeles Rams (-4.5) (Alternate Spread) + Jaxon Smith-Njigba (Any Time Touchdown Scorer)
- **+583** PARLAY ORGANIC+MANUAL. Tennessee Titans @ Cincinnati Bengals; Kansas City Chiefs @ Denver Broncos; Baltimore Ravens @ Buffalo Bills. Back this parlay and watch the crew discuss live on The NFL Today on CBS! Joe Burrow 3+ Passing Touchdowns (Joe Burrow - Alt Passing TDs) + Bo Nix 225+ Yards (Bo Nix - Alt Passing + Rushing Yds) + James Cook 90+ Yards (James Cook - Alt Rushing + Receiving Yds)
- **+3548** SGP_PLUS ORGANIC+MANUAL. Los Angeles Chargers @ Los Angeles Rams; New England Patriots @ Miami Dolphins; Kansas City Chiefs @ Denver Broncos. Running Riot: Five RBs look to run wild and find the end zone across Sunday's slate leg not attached + leg not attached + Kenneth Walker III (Any Time Touchdown Scorer)
- **+247** PARLAY ORGANIC+MANUAL. Kansas City Chiefs @ Denver Broncos; New England Patriots @ Miami Dolphins; Los Angeles Chargers @ Los Angeles Rams. Triple Triumph: Back the Rams & Broncos to win at home, plus the Pats to win in Miami Denver Broncos (Moneyline) + New England Patriots (Moneyline) + Los Angeles Rams (Moneyline)
- **+432** PARLAY ORGANIC. Arizona Cardinals @ Dallas Cowboys; Las Vegas Raiders @ New York Jets. Michael Wilson 6+ Receptions (Michael Wilson - Alt Receptions) + Garrett Wilson 6+ Receptions (Garrett Wilson - Alt Receptions)
- **+529** PARLAY ORGANIC. Los Angeles Chargers @ Los Angeles Rams; Arizona Cardinals @ Dallas Cowboys. Ladd McConkey 60+ Yards (Ladd McConkey - Alt Receiving Yds) + Michael Wilson 70+ Yards (Michael Wilson - Alt Receiving Yds)
- **+1281** PARLAY ORGANIC. Cleveland Browns @ Pittsburgh Steelers; Las Vegas Raiders @ New York Jets; Kansas City Chiefs @ Denver Broncos; Philadelphia Eagles @ Washington Commanders. Pittsburgh Steelers -3.5 (Spread) + New York Jets -1.5 (Spread) + Denver Broncos 1.5 (Spread) + Philadelphia Eagles 5.5 (Spread)
- **+907** PARLAY ORGANIC. Los Angeles Chargers @ Los Angeles Rams; Arizona Cardinals @ Dallas Cowboys. Ladd McConkey 70+ Yards (Ladd McConkey - Alt Receiving Yds) + Michael Wilson 80+ Yards (Michael Wilson - Alt Receiving Yds)
- **+1541** PARLAY ORGANIC. Tennessee Titans @ Cincinnati Bengals; Arizona Cardinals @ Dallas Cowboys; Kansas City Chiefs @ Denver Broncos; Philadelphia Eagles @ Washington Commanders. Ja'Marr Chase (Any Time Touchdown Scorer) + CeeDee Lamb (Any Time Touchdown Scorer) + Kenneth Walker III (Any Time Touchdown Scorer) + Stefon Diggs (Any Time Touchdown Scorer)
- **+296** PARLAY ORGANIC. Tennessee Titans @ Cincinnati Bengals; Arizona Cardinals @ Dallas Cowboys; Indianapolis Colts @ Jacksonville Jaguars; Los Angeles Chargers @ Los Angeles Rams; New England Patriots @ Miami Dolphins; Philadelphia Eagles @ Washington Commanders. Cincinnati Bengals (Moneyline) + Dallas Cowboys (Moneyline) + Jacksonville Jaguars (Moneyline) + Los Angeles Rams (Moneyline) + New England Patriots (Moneyline) + Washington Commanders (Moneyline)
- **+2677** SGP_PLUS ORGANIC. Arizona Cardinals @ Dallas Cowboys; Baltimore Ravens @ Buffalo Bills; Tennessee Titans @ Cincinnati Bengals; Los Angeles Chargers @ Los Angeles Rams. leg not attached + leg not attached + Tee Higgins (Any Time Touchdown Scorer) + Puka Nacua (Any Time Touchdown Scorer)
- **+1300** PARLAY ORGANIC. Tennessee Titans @ Cincinnati Bengals; Cleveland Browns @ Pittsburgh Steelers. Tennessee Titans (+3.5) (Alternate Spread) + Under (31.5) (Alternate Total Points)
- **+362** PARLAY ORGANIC. Baltimore Ravens @ Buffalo Bills; Tennessee Titans @ Cincinnati Bengals; Los Angeles Chargers @ Los Angeles Rams; New England Patriots @ Miami Dolphins; Arizona Cardinals @ Dallas Cowboys; Indianapolis Colts @ Jacksonville Jaguars. Buffalo Bills (Moneyline) + Cincinnati Bengals (Moneyline) + Los Angeles Rams (Moneyline) + New England Patriots (Moneyline) + Dallas Cowboys (Moneyline) + Jacksonville Jaguars (Moneyline)
- **+316** PARLAY ORGANIC. Las Vegas Raiders @ New York Jets; Atlanta Falcons @ Tampa Bay Buccaneers. Las Vegas Raiders (Moneyline) + Atlanta Falcons (Moneyline)
- **+263** PARLAY ORGANIC. Baltimore Ravens @ Buffalo Bills; Indianapolis Colts @ Jacksonville Jaguars; Tennessee Titans @ Cincinnati Bengals; Los Angeles Chargers @ Los Angeles Rams; New England Patriots @ Miami Dolphins. Buffalo Bills (Moneyline) + Jacksonville Jaguars (Moneyline) + Cincinnati Bengals (Moneyline) + Los Angeles Rams (Moneyline) + New England Patriots (Moneyline)
- **+220** PARLAY ORGANIC. Los Angeles Chargers @ Los Angeles Rams; Kansas City Chiefs @ Denver Broncos; New England Patriots @ Miami Dolphins. Los Angeles Rams (Moneyline) + Kansas City Chiefs (Moneyline) + New England Patriots (Moneyline)
- **+1420** PARLAY ORGANIC. Cleveland Browns @ Pittsburgh Steelers; Indianapolis Colts @ Jacksonville Jaguars. Rico Dowdle (Any Time Touchdown Scorer) + Chris Rodriguez Jr. (Any Time Touchdown Scorer)
- **+409** PARLAY ORGANIC. Atlanta Falcons @ Tampa Bay Buccaneers; Baltimore Ravens @ Buffalo Bills; Minnesota Vikings @ Detroit Lions. Bijan Robinson (Any Time Touchdown Scorer) + Derrick Henry (Any Time Touchdown Scorer) + Amon-Ra St. Brown (Any Time Touchdown Scorer)
- **+1821** PARLAY ORGANIC. Las Vegas Raiders @ New York Jets; Indianapolis Colts @ Jacksonville Jaguars; Tennessee Titans @ Cincinnati Bengals; Arizona Cardinals @ Dallas Cowboys; Los Angeles Chargers @ Los Angeles Rams. Ashton Jeanty (Any Time Touchdown Scorer) + Parker Washington (Any Time Touchdown Scorer) + Chase Brown (Any Time Touchdown Scorer) + Trey McBride (Any Time Touchdown Scorer) + Kyren Williams (Any Time Touchdown Scorer)
- **+3964** PARLAY ORGANIC. Atlanta Falcons @ Tampa Bay Buccaneers; Tennessee Titans @ Cincinnati Bengals; Minnesota Vikings @ Detroit Lions; Baltimore Ravens @ Buffalo Bills; Arizona Cardinals @ Dallas Cowboys. Drake London (Any Time Touchdown Scorer) + Ja'Marr Chase (Any Time Touchdown Scorer) + Amon-Ra St. Brown (Any Time Touchdown Scorer) + Zay Flowers (Any Time Touchdown Scorer) + CeeDee Lamb (Any Time Touchdown Scorer)
- **+207** PARLAY ORGANIC. Tennessee Titans @ Cincinnati Bengals; Los Angeles Chargers @ Los Angeles Rams; New England Patriots @ Miami Dolphins; Baltimore Ravens @ Buffalo Bills. Cincinnati Bengals (Moneyline) + Los Angeles Rams (Moneyline) + New England Patriots (Moneyline) + Buffalo Bills (Moneyline)
- **+2403** PARLAY ORGANIC. Baltimore Ravens @ Buffalo Bills; Minnesota Vikings @ Detroit Lions; Kansas City Chiefs @ Denver Broncos; New England Patriots @ Miami Dolphins; Chicago Bears @ Seattle Seahawks. Buffalo Bills -3 (Spread) + Minnesota Vikings 3.5 (Spread) + Kansas City Chiefs -1.5 (Spread) + New England Patriots -7 (Spread) + Chicago Bears 3 (Spread)
- **+2034** PARLAY ORGANIC+MANUAL. Kansas State @ Colorado; Coastal Carolina @ Georgia State; Connecticut @ Air Force; Washington State @ San Diego State. Time to Hit the Books! Host Brad Powers is picking these four schools to win in Week 9! Kansas State (Moneyline) + Coastal Carolina (Moneyline) + Connecticut (Moneyline) + Washington State (Moneyline)
- **+4019** PARLAY ORGANIC+MANUAL. SMU @ Syracuse; Auburn @ Ole Miss; Miami Florida @ North Carolina; Oregon State @ Fresno State. Nightmare Matchup: Explosive offenses scare defenses by moving the ball on Halloween SMU 450+ Yards (SMU - Alt Total Yards) + Ole Miss 425+ Yards (Ole Miss - Alt Total Yards) + Miami (FL) 500+ Yards (Miami (FL) - Alt Total Yards) + Oregon St 500+ Yards (Oregon St - Alt Total Yards)
- **+595** PARLAY ORGANIC+MANUAL. Notre Dame @ Navy; Arizona State @ BYU; Minnesota @ Indiana; Missouri @ Arkansas. Start Saturday strong with this parlay and watch the crew discuss live on FOX Big Noon Kickoff! Notre Dame (-27.5) (Alternate Spread) + Arizona State (+17.5) (Alternate Spread) + Under (14.5) (Minnesota Alternate Total) + Missouri -10.5 (Spread)
- **+1433** PARLAY ORGANIC+MANUAL. Ohio State @ USC; Miami Florida @ North Carolina. Trick or Treat: USC & UNC seek Halloween upsets over the nation's top two ranked teams USC (Moneyline) + North Carolina (Moneyline)
- **+2612** PARLAY ORGANIC+MANUAL. SMU @ Syracuse; Wisconsin @ Iowa; Utah @ Cincinnati. Spooky Season: Three underdogs look to turn Halloween into a nightmare for the chalk Syracuse (Moneyline) + Wisconsin (Moneyline) + Cincinnati (Moneyline)
- **+1128** PARLAY ORGANIC+MANUAL. Arizona @ Texas Tech; Auburn @ Ole Miss; Florida @ Georgia; Miami Florida @ North Carolina. Scary Good: Last season's CFP contenders look to deliver double-digit wins on Halloween Texas Tech (-9.5) (Alternate Spread) + Ole Miss (-9.5) (Alternate Spread) + Georgia (-9.5) (Alternate Spread) + Miami Florida (-9.5) (Alternate Spread)
- **+3414** PARLAY ORGANIC+MANUAL. Temple @ East Carolina; Clemson @ Florida State; South Carolina @ Oklahoma; Washington State @ San Diego State. Hit the Books co-host Joey Knish picks his underdog moneyline parlay for Week 9! Temple (Moneyline) + Clemson (Moneyline) + South Carolina (Moneyline) + Washington State (Moneyline)
- **+776** PARLAY ORGANIC+MANUAL. Boston College @ Duke; Minnesota @ Indiana; Utah @ Cincinnati; Oklahoma State @ Iowa State. Business as Usual: Four offenses averaging 400+ yards per game aim to deliver again Duke 400+ Yards (Duke - Alt Total Yards) + Indiana 400+ Yards (Indiana - Alt Total Yards) + Utah 400+ Yards (Utah - Alt Total Yards) + OK State 400+ Yards (OK State - Alt Total Yards)
- **+668** PARLAY ORGANIC+MANUAL. Miami Florida @ North Carolina; Ohio State @ USC; Mississippi State @ Texas. Double Down: Miami, Ohio State & Texas look to cover by two TDs Miami Florida (-13.5) (Alternate Spread) + Ohio State (-13.5) (Alternate Spread) + Texas (-13.5) (Alternate Spread)
- **+1161** PARLAY ORGANIC+MANUAL. SMU @ Syracuse; Florida @ Georgia; Mississippi State @ Texas; Missouri @ Arkansas. Best of Both Worlds: Syracuse & Florida hang tough as Texas & Mizzou cover big Syracuse (+10.5) (Alternate Spread) + Florida (+14.5) (Alternate Spread) + Texas (-20.5) (Alternate Spread) + Missouri (-13.5) (Alternate Spread)
- **+385** PARLAY ORGANIC+MANUAL. Bowling Green @ Western Michigan; Louisiana Tech @ South Alabama; Washington @ Nebraska. Take Todd McShay's picks for CFB Week 9! Western Michigan (-10.5) (Alternate Spread) + Louisiana Tech (-5.5) (Alternate Spread) + Nebraska (-6.5) (Alternate Spread)
- **+782** PARLAY ORGANIC+MANUAL. Wisconsin @ Iowa; Northwestern @ Oregon; Utah @ Cincinnati; Missouri @ Arkansas. Frequent Flyers: Four AP Top 25 teams look to turn road trips into Saturday wins Wisconsin (Moneyline) + Northwestern (Moneyline) + Utah (Moneyline) + Missouri (Moneyline)
- **+793** PARLAY ORGANIC+MANUAL. Ohio State @ USC; Miami Florida @ North Carolina; Missouri @ Arkansas; Washington @ Nebraska. Road to a Fast Start: Back four road teams to win the 1st quarter Ohio State (1st Quarter Winner) + Miami Florida (1st Quarter Winner) + Missouri (1st Quarter Winner) + Washington (1st Quarter Winner)
- **+273** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Tulane (Moneyline) + UCF (Moneyline) + Kent State (Moneyline)
- **+212** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Tulane (Moneyline) + Baylor (Moneyline) + Kent State (Moneyline)
- **+496** PARLAY ORGANIC. South Carolina @ Oklahoma; Baylor @ UCF; Illinois @ Maryland. Oklahoma (Moneyline) + UCF (Moneyline) + Illinois (Moneyline)
- **+642** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Tulane -8.5 (Spread) + UCF 2.5 (Spread) + Kent State -7.5 (Spread)
- **+616** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Tulane -8.5 (Spread) + Baylor -2.5 (Spread) + Kent State -7.5 (Spread)
- **+1021** PARLAY ORGANIC. Utah @ Cincinnati; California @ NC State. Cincinnati (Moneyline) + California (Moneyline)
- **+2380** PARLAY ORGANIC. Baylor @ UCF; Tulane @ Charlotte; Kent State @ Sacramento State. UCF (Moneyline) + Charlotte (Moneyline) + Sacramento State (Moneyline)
- **+701** PARLAY ORGANIC. Kent State @ Sacramento State; Baylor @ UCF; Tulane @ Charlotte. Kent State -7.5 (Spread) + UCF (Moneyline) + Tulane -8.5 (Spread)
- **+245** PARLAY ORGANIC. Baylor @ UCF; Kent State @ Sacramento State; Tulane @ Charlotte. UCF 2.5 (Spread) + Kent State (Moneyline) + Tulane (Moneyline)
- **+271** PARLAY ORGANIC. Baylor @ UCF; Tulane @ Charlotte. UCF 2.5 (Spread) + Tulane -8.5 (Spread)
- **+258** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF. Tulane -8.5 (Spread) + Baylor -2.5 (Spread)
- **+300** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF. Tulane -8.5 (Spread) + UCF (Moneyline)
- **+1976** PARLAY ORGANIC. Kent State @ Sacramento State; Baylor @ UCF; Tulane @ Charlotte. Sacramento State (Moneyline) + Baylor (Moneyline) + Charlotte (Moneyline)
- **+1070** PARLAY ORGANIC. Arizona @ Texas Tech; South Carolina @ Oklahoma; Ohio State @ USC; Northwestern @ Oregon. Texas Tech (Moneyline) + Oklahoma (Moneyline) + USC (Moneyline) + Oregon (Moneyline)
- **+281** PARLAY ORGANIC. Tulane @ Charlotte; Kent State @ Sacramento State. Tulane -8.5 (Spread) + Kent State -7.5 (Spread)
- **+575** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Charlotte 8.5 (Spread) + UCF 2.5 (Spread) + Sacramento State 7.5 (Spread)
- **+771** SGP_PLUS ORGANIC. Baylor @ UCF; Tulane @ Charlotte; Kent State @ Sacramento State. leg not attached + leg not attached + leg not attached
- **+1218** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Charlotte (Moneyline) + Baylor (Moneyline) + Kent State -7.5 (Spread)
- **+2061** PARLAY ORGANIC. Wisconsin @ Iowa; Arizona @ Texas Tech; Northwestern @ Oregon; South Carolina @ Oklahoma; Ohio State @ USC. Iowa -1.5 (Spread) + Texas Tech -3.5 (Spread) + Oregon -3.5 (Spread) + Oklahoma -2.5 (Spread) + USC 6.5 (Spread)
- **+575** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Tulane -8.5 (Spread) + UCF 2.5 (Spread) + Sacramento State 7.5 (Spread)
- **+753** PARLAY ORGANIC. Kent State @ Sacramento State; Baylor @ UCF; Tulane @ Charlotte. Sacramento State (Moneyline) + UCF (Moneyline) + Tulane (Moneyline)
- **+552** PARLAY ORGANIC. Kent State @ Sacramento State; Baylor @ UCF; Tulane @ Charlotte. Sacramento State 7.5 (Spread) + Baylor -2.5 (Spread) + Tulane -8.5 (Spread)
- **+205** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Tulane (-4.5) (Alternate Spread) + Baylor (Moneyline) + Kent State (+5.5) (Alternate Spread)
- **+2480** PARLAY ORGANIC. California @ NC State; Arizona @ Texas Tech; Northwestern @ Oregon; Ohio State @ USC; Oregon State @ Fresno State. NC State (Moneyline) + Texas Tech -3.5 (Spread) + Oregon -3.5 (Spread) + Ohio State -6.5 (Spread) + Fresno State (Moneyline)
- **+452** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Tulane -8.5 (Spread) + UCF (Moneyline) + Kent State (Moneyline)
- **+434** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Charlotte (+9.5) (Alternate Spread) + UCF (Moneyline) + Kent State (Moneyline)
- **+1235** PARLAY ORGANIC. Arizona @ Texas Tech; Northwestern @ Oregon; South Carolina @ Oklahoma. Arizona (Moneyline) + Northwestern (Moneyline) + South Carolina (Moneyline)
- **+452** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Charlotte 8.5 (Spread) + UCF (Moneyline) + Kent State (Moneyline)
- **+275** PARLAY ORGANIC. Baylor @ UCF; Kent State @ Sacramento State. Baylor -2.5 (Spread) + Kent State -7.5 (Spread)
- **+552** PARLAY ORGANIC. Kent State @ Sacramento State; Baylor @ UCF; Tulane @ Charlotte. Sacramento State 7.5 (Spread) + Baylor -2.5 (Spread) + Charlotte 8.5 (Spread)
- **+462** PARLAY ORGANIC. Kansas State @ Colorado; Louisiana Tech @ South Alabama; Marshall @ Old Dominion. Colorado (Moneyline) + Louisiana Tech (Moneyline) + Old Dominion (Moneyline)
- **+984** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF; Kent State @ Sacramento State. Charlotte (Moneyline) + UCF (Moneyline) + Kent State (Moneyline)
- **+233** PARLAY ORGANIC. Tulane @ Charlotte; Kent State @ Sacramento State; Baylor @ UCF. Tulane (Moneyline) + Kent State (Moneyline) + Baylor -2.5 (Spread)
- **+4707** PARLAY ORGANIC. Louisiana Tech @ South Alabama; Oklahoma State @ Iowa State; Washington @ Nebraska; Oregon State @ Fresno State; New Mexico @ San Jose State; Nevada @ UCLA. Louisiana Tech -6.5 (Spread) + Oklahoma State -9.5 (Spread) + Nebraska -7.5 (Spread) + Oregon State -5.5 (Spread) + New Mexico -14.5 (Spread) + UCLA -22.5 (Spread)
- **+235** PARLAY ORGANIC. Baylor @ UCF; Tulane @ Charlotte. Baylor (Moneyline) + Tulane -8.5 (Spread)
- **+258** PARLAY ORGANIC. Tulane @ Charlotte; Baylor @ UCF. Charlotte 8.5 (Spread) + Baylor -2.5 (Spread)
- **+1580** PARLAY MANUAL. Ohio State @ USC; Mississippi State @ Texas; Miami Florida @ North Carolina. Run It Up: Blue Bloods rack up yardage in primetime matchups on Saturday Ohio State 400+ Yards (Ohio State - Alt Total Yards) + Texas 450+ Yards (Texas - Alt Total Yards) + Miami (FL) 500+ Yards (Miami (FL) - Alt Total Yards)
- **+3002** PARLAY ORGANIC+MANUAL. Los Angeles Lakers @ Golden State Warriors; Charlotte Hornets @ Washington Wizards. Red-Hot Rookies: AJ led Washington in scoring in his debut; Yaxel’s scored 25+ in three straight Yaxel Lendeborg (25+ Points) + AJ Dybantsa (25+ Points)
- **+472** PARLAY ORGANIC+MANUAL. Orlando Magic @ Toronto Raptors; New York Knicks @ Philadelphia 76ers; Los Angeles Lakers @ Golden State Warriors. Been There, Won That: Back 3 teams that won the first meeting to win these early-season rematches Toronto Raptors (Moneyline) + Philadelphia 76ers (Moneyline) + Los Angeles Lakers (Moneyline)
- **+534** SGP_PLUS ORGANIC+MANUAL. Los Angeles Lakers @ Golden State Warriors; Denver Nuggets @ Phoenix Suns. Star Power: Back Steph, Luka & the Joker to shine on Friday night leg not attached + Nikola Jokic (Player Triple Double)
- **+1496** PARLAY ORGANIC. Los Angeles Lakers @ Golden State Warriors; Charlotte Hornets @ Washington Wizards; Chicago Bulls @ Boston Celtics. Yaxel Lendeborg (20+ Points) + AJ Dybantsa (20+ Points) + Caleb Wilson (20+ Points)
- **+275** PARLAY ORGANIC. New York Knicks @ Philadelphia 76ers; Indiana Pacers @ Miami Heat. Under 58.5 (1st Quarter Alternate Total Points) + Over 114.5 (1st Half Total Points)
- **+587** PARLAY ORGANIC. New York Knicks @ Philadelphia 76ers; Los Angeles Lakers @ Golden State Warriors; Denver Nuggets @ Phoenix Suns. Tyrese Maxey (25+ Points) + Stephen Curry (25+ Points) + Devin Booker (25+ Points)
- **+772** PARLAY ORGANIC. Houston Rockets @ Dallas Mavericks; Indiana Pacers @ Miami Heat; Los Angeles Lakers @ Golden State Warriors. Max Christie (2+ Threes) + Kelly Oubre Jr. (2+ Threes) + Matisse Thybulle (2+ Threes)
- **+2918** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Chicago Bulls @ Boston Celtics; Los Angeles Lakers @ Golden State Warriors. AJ Dybantsa (4+ Assists) + Caleb Wilson (4+ Assists) + Yaxel Lendeborg (4+ Assists)
- **+569** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Los Angeles Lakers @ Golden State Warriors. AJ Dybantsa (20+ Points) + Yaxel Lendeborg (20+ Points)
- **+2022** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Chicago Bulls @ Boston Celtics; New York Knicks @ Philadelphia 76ers; Indiana Pacers @ Miami Heat; Los Angeles Lakers @ Golden State Warriors. Brandon Miller (Player To Score 3+ Points In Each Quarter) + Jayson Tatum (Player To Score 3+ Points In Each Quarter) + Jalen Brunson (Player To Score 3+ Points In Each Quarter) + Giannis Antetokounmpo (Player To Score 3+ Points In Each Quarter) + Luka Doncic (Player To Score 3+ Points In Each Quarter)
- **+476** SGP_PLUS ORGANIC. Houston Rockets @ Dallas Mavericks; New York Knicks @ Philadelphia 76ers; Los Angeles Lakers @ Golden State Warriors. leg not attached + Tyrese Maxey (25+ Pts + Ast) + Yaxel Lendeborg (20+ Points)
- **+3903** PARLAY ORGANIC. New York Knicks @ Philadelphia 76ers; Los Angeles Lakers @ Golden State Warriors; Denver Nuggets @ Phoenix Suns. Tyrese Maxey (30+ Points) + Stephen Curry (30+ Points) + Devin Booker (30+ Points)
- **+4773** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Chicago Bulls @ Boston Celtics; Los Angeles Clippers @ Minnesota Timberwolves; Denver Nuggets @ Phoenix Suns. AJ Dybantsa (20+ Points) + Payton Pritchard (4+ Threes) + Keaton Wagler (15+ Points) + Nikola Jokic (Player Triple Double)
- **+2710** PARLAY ORGANIC. Los Angeles Lakers @ Golden State Warriors; Indiana Pacers @ Miami Heat. Luka Doncic (6+ Threes) + Andrew Nembhard (4+ Threes)
- **+1878** PARLAY ORGANIC. Los Angeles Lakers @ Golden State Warriors; Houston Rockets @ Dallas Mavericks; Chicago Bulls @ Boston Celtics; Detroit Pistons @ Brooklyn Nets. Draymond Green (6+ Assists) + Alperen Sengun (6+ Assists) + Jayson Tatum (8+ Assists) + Julius Randle (6+ Assists)
- **+3134** PARLAY ORGANIC. Denver Nuggets @ Phoenix Suns; Detroit Pistons @ Brooklyn Nets. Nikola Jokic (60+ Pts + Reb + Ast) + Nolan Traore (4+ Rebounds)
- **+475** PARLAY ORGANIC. Chicago Bulls @ Boston Celtics; Detroit Pistons @ Brooklyn Nets; Houston Rockets @ Dallas Mavericks; Indiana Pacers @ Miami Heat; Los Angeles Clippers @ Minnesota Timberwolves; Orlando Magic @ Toronto Raptors. Boston Celtics (Moneyline) + Detroit Pistons (Moneyline) + Houston Rockets (Moneyline) + Miami Heat (Moneyline) + Minnesota Timberwolves (Moneyline) + Toronto Raptors (Moneyline)
- **+3392** PARLAY ORGANIC. Los Angeles Lakers @ Golden State Warriors; Chicago Bulls @ Boston Celtics; Detroit Pistons @ Brooklyn Nets; New York Knicks @ Philadelphia 76ers; Indiana Pacers @ Miami Heat. Yaxel Lendeborg (2+ Threes) + Jalen Smith (2+ Threes) + Julius Randle (2+ Threes) + Karl-Anthony Towns (2+ Threes) + Bobby Portis (2+ Threes)
- **+4483** PARLAY ORGANIC. Detroit Pistons @ Brooklyn Nets; Charlotte Hornets @ Washington Wizards; New York Knicks @ Philadelphia 76ers. Ausar Thompson (6+ Assists) + Kyshawn George (6+ Assists) + Tyrese Maxey (6+ Assists)
- **+2101** SGP_PLUS ORGANIC. Houston Rockets @ Dallas Mavericks; Los Angeles Lakers @ Golden State Warriors. leg not attached + leg not attached
- **+2790** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Los Angeles Lakers @ Golden State Warriors; Houston Rockets @ Dallas Mavericks; New York Knicks @ Philadelphia 76ers. Kyshawn George (25+ Pts + Reb + Ast) + Quentin Grimes (15+ Pts + Reb + Ast) + Fred VanVleet (25+ Pts + Reb + Ast) + OG Anunoby (25+ Pts + Reb + Ast)
- **+3438** SGP_PLUS ORGANIC. Orlando Magic @ Toronto Raptors; New York Knicks @ Philadelphia 76ers; Los Angeles Clippers @ Minnesota Timberwolves; Houston Rockets @ Dallas Mavericks. leg not attached + leg not attached + Darius Garland Under 6.5 (Darius Garland - 1st Qtr Points) + Cooper Flagg Under 6.5 (Cooper Flagg - 1st Qtr Points)
- **+1210** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Chicago Bulls @ Boston Celtics; New York Knicks @ Philadelphia 76ers; Houston Rockets @ Dallas Mavericks. Brandon Miller Over 33.5 (Brandon Miller - Pts + Reb) + Jayson Tatum Over 15.5 (Jayson Tatum - Reb + Ast) + Joel Embiid Over 24.5 (Joel Embiid - Points) + Cooper Flagg Over 11.5 (Cooper Flagg - Reb + Ast)
- **+334** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Detroit Pistons @ Brooklyn Nets; Los Angeles Clippers @ Minnesota Timberwolves; Indiana Pacers @ Miami Heat. AJ Dybantsa (15+ Points) + Ausar Thompson (6+ Rebounds) + Jonathan Kuminga (10+ Points) + Pascal Siakam (20+ Points)
- **+818** PARLAY ORGANIC. Chicago Bulls @ Boston Celtics; Orlando Magic @ Toronto Raptors; Detroit Pistons @ Brooklyn Nets; Indiana Pacers @ Miami Heat; Los Angeles Clippers @ Minnesota Timberwolves; Houston Rockets @ Dallas Mavericks; Denver Nuggets @ Phoenix Suns. Boston Celtics (Moneyline) + Toronto Raptors (Moneyline) + Detroit Pistons (Moneyline) + Miami Heat (Moneyline) + Minnesota Timberwolves (Moneyline) + Houston Rockets (Moneyline) + Denver Nuggets (Moneyline)
- **+1260** PARLAY ORGANIC. Los Angeles Clippers @ Minnesota Timberwolves; Indiana Pacers @ Miami Heat. Ayo Dosunmu (3+ Threes) + Andrew Nembhard (3+ Threes)
- **+254** PARLAY ORGANIC. Houston Rockets @ Dallas Mavericks; Los Angeles Clippers @ Minnesota Timberwolves. Cooper Flagg Under 6.5 (Cooper Flagg - 1st Qtr Points) + Darius Garland Under 6.5 (Darius Garland - 1st Qtr Points)
- **+495** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Los Angeles Lakers @ Golden State Warriors; New York Knicks @ Philadelphia 76ers. Moussa Diabaté (10+ Rebounds) + Luka Doncic (8+ Rebounds) + Karl-Anthony Towns (12+ Rebounds)
- **+1212** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; New York Knicks @ Philadelphia 76ers; Orlando Magic @ Toronto Raptors; Indiana Pacers @ Miami Heat. Washington Wizards -1.5 (Spread) + New York Knicks -2.5 (Alternate Spread) + Under 116.5 (TOR Raptors Total Pts) + Indiana Pacers +8.5 (Alternate Spread)
- **+3420** PARLAY ORGANIC. Indiana Pacers @ Miami Heat; Detroit Pistons @ Brooklyn Nets. Giannis Antetokounmpo (First Basket) + Julius Randle (First Basket)
- **+699** PARLAY ORGANIC. Indiana Pacers @ Miami Heat; Los Angeles Lakers @ Golden State Warriors. Andrew Nembhard (3+ Threes) + Luka Doncic (5+ Threes)
- **+695** PARLAY ORGANIC. Los Angeles Lakers @ Golden State Warriors; Indiana Pacers @ Miami Heat. Luka Doncic Over 4.5 (Luka Doncic - Made Threes) + Andrew Nembhard (3+ Threes)
- **+667** PARLAY ORGANIC. Los Angeles Clippers @ Minnesota Timberwolves; New York Knicks @ Philadelphia 76ers; Charlotte Hornets @ Washington Wizards. Los Angeles Clippers 7.5 (Spread) + Philadelphia 76ers (Moneyline) + Charlotte Hornets +1.5 (Alternate Spread)
- **+555** SGP_PLUS ORGANIC. Detroit Pistons @ Brooklyn Nets; Denver Nuggets @ Phoenix Suns; Indiana Pacers @ Miami Heat. leg not attached + Nikola Jokic (45+ Pts + Reb + Ast) + Giannis Antetokounmpo (45+ Pts + Reb + Ast)
- **+1371** PARLAY ORGANIC. New York Knicks @ Philadelphia 76ers; Charlotte Hornets @ Washington Wizards; Indiana Pacers @ Miami Heat; Orlando Magic @ Toronto Raptors. New York Knicks -3.5 (Spread) + Washington Wizards -1.5 (Spread) + Indiana Pacers 7.5 (Spread) + Under 116.5 (TOR Raptors Total Pts)
- **+789** PARLAY ORGANIC. Detroit Pistons @ Brooklyn Nets; Charlotte Hornets @ Washington Wizards; Los Angeles Clippers @ Minnesota Timberwolves; Chicago Bulls @ Boston Celtics; Orlando Magic @ Toronto Raptors. Over 216.5 (Alternate Total Points) + Over 214.5 (Alternate Total Points) + Over 217.5 (Alternate Total Points) + Over 228.5 (Alternate Total Points) + Over 221.5 (Alternate Total Points)
- **+667** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; New York Knicks @ Philadelphia 76ers; Los Angeles Clippers @ Minnesota Timberwolves. Charlotte Hornets 1.5 (Spread) + Philadelphia 76ers (Moneyline) + Los Angeles Clippers 7.5 (Spread)
- **+3596** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; Los Angeles Lakers @ Golden State Warriors; Houston Rockets @ Dallas Mavericks. Anthony Davis (25+ Points) + Luka Doncic (40+ Points) + Cooper Flagg (30+ Points)
- **+300** PARLAY ORGANIC. Charlotte Hornets @ Washington Wizards; New York Knicks @ Philadelphia 76ers; Detroit Pistons @ Brooklyn Nets. Kyshawn George (4+ Assists) + Tyrese Maxey (4+ Assists) + Ausar Thompson (4+ Assists)
- **+402** PARLAY ORGANIC+MANUAL. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Trick, Treat & Three Wins: Back Vegas, Florida & Seattle Vegas Golden Knights (Moneyline) + Florida Panthers (Moneyline) + Seattle Kraken (Moneyline)
- **+402** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. New Jersey Devils (Moneyline) + Florida Panthers (Moneyline) + Seattle Kraken (Moneyline)
- **+3610** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. Connor Brown (Anytime Goal Scorer) + Berkly Catton (Anytime Goal Scorer)
- **+1941** PARLAY ORGANIC. Seattle Kraken @ Calgary Flames; Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights. Seattle Kraken -1.5 (Puck Line) + Florida Panthers -1.5 (Puck Line) + Vegas Golden Knights -1.5 (Puck Line)
- **+438** PARLAY ORGANIC. Seattle Kraken @ Calgary Flames; New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers. Calgary Flames (Moneyline) + Vegas Golden Knights (Moneyline) + Florida Panthers (Moneyline)
- **+1860** PARLAY ORGANIC. Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Cole Perfetti (Anytime Goal Scorer) + Mikael Backlund (Anytime Goal Scorer)
- **+922** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames; Winnipeg Jets @ Florida Panthers. Vegas Golden Knights (Moneyline) + Seattle Kraken (Moneyline) + Winnipeg Jets (Moneyline)
- **+1495** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Jack Eichel (Anytime Goal Scorer) + Brady Tkachuk (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+533** SGP_PLUS ORGANIC. Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. leg not attached + Tomas Hertl (2+ Shots on Goal) + Jordan Eberle (2+ Shots on Goal)
- **+288** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Over 5.5 (Alternate Total Goals) + Kyle Connor (3+ Shots on Goal) + Over 2.5 (Seattle Kraken Alt Total Goals)
- **+438** PARLAY ORGANIC. Seattle Kraken @ Calgary Flames; Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights. Calgary Flames (Moneyline) + Florida Panthers (Moneyline) + New Jersey Devils (Moneyline)
- **+2051** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Jack Eichel (Anytime Goal Scorer) + Kyle Connor (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+1630** SGP_PLUS ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers. leg not attached + Brady Tkachuk (Anytime Goal Scorer)
- **+1060** PARLAY ORGANIC. Seattle Kraken @ Calgary Flames; New Jersey Devils @ Vegas Golden Knights. Joel Farabee (Anytime Goal Scorer) + Jesper Bratt (Anytime Goal Scorer)
- **+996** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. New Jersey Devils (Moneyline) + Winnipeg Jets (Moneyline) + Calgary Flames (Moneyline)
- **+254** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. New Jersey Devils 1.5 (Puck Line) + Florida Panthers (Moneyline) + Seattle Kraken (Moneyline)
- **+3716** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Luke Evangelista (Anytime Goal Scorer) + Anton Lundell (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+3311** SGP_PLUS ORGANIC. Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights. leg not attached + leg not attached
- **+1860** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. Luke Evangelista (Anytime Goal Scorer) + Mikael Backlund (Anytime Goal Scorer)
- **+626** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Vegas Golden Knights (Moneyline) + Florida Panthers -1.5 (Puck Line) + Seattle Kraken (Moneyline)
- **+922** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. New Jersey Devils (Moneyline) + Winnipeg Jets (Moneyline) + Seattle Kraken (Moneyline)
- **+2868** PARLAY ORGANIC. Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. Cole Perfetti (Anytime Goal Scorer) + Jack Eichel (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+252** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. Vegas Golden Knights (Moneyline) + Seattle Kraken (Moneyline)
- **+996** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Vegas Golden Knights (Moneyline) + Winnipeg Jets (Moneyline) + Calgary Flames (Moneyline)
- **+991** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers. Mark Stone (Anytime Goal Scorer) + Mark Scheifele (Anytime Goal Scorer)
- **+1854** PARLAY ORGANIC. Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. Sam Reinhart (Anytime Goal Scorer) + Mark Stone (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+276** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Vegas Golden Knights (Moneyline) + Florida Panthers (Moneyline) + Calgary Flames 1.5 (Puck Line)
- **+2851** PARLAY ORGANIC. Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. Carter Verhaeghe (Anytime Goal Scorer) + Nico Hischier (Anytime Goal Scorer) + Matvei Gridin (Anytime Goal Scorer)
- **+1438** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Jack Hughes (Anytime Goal Scorer) + Brady Tkachuk (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+960** PARLAY ORGANIC. Seattle Kraken @ Calgary Flames; Winnipeg Jets @ Florida Panthers. Bobby McMann (Anytime Goal Scorer) + Cole Perfetti (Anytime Goal Scorer)
- **+229** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. New Jersey Devils 1.5 (Puck Line) + Winnipeg Jets 1.5 (Puck Line) + Calgary Flames 1.5 (Puck Line)
- **+626** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. New Jersey Devils (Moneyline) + Florida Panthers -1.5 (Puck Line) + Seattle Kraken (Moneyline)
- **+473** PARLAY ORGANIC. Seattle Kraken @ Calgary Flames; New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers. Seattle Kraken (Moneyline) + New Jersey Devils (Moneyline) + Over 5.5 (Alternate Total Goals)
- **+2170** PARLAY ORGANIC. Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights; Seattle Kraken @ Calgary Flames. Kyle Connor (Anytime Goal Scorer) + Jack Hughes (Anytime Goal Scorer) + Joel Farabee (Anytime Goal Scorer)
- **+1930** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Jack Eichel (Anytime Goal Scorer) + Sam Reinhart (Anytime Goal Scorer) + Joel Farabee (Anytime Goal Scorer)
- **+1688** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Jack Hughes (Anytime Goal Scorer) + Sam Reinhart (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+3661** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Timo Meier (Anytime Goal Scorer) + Sam Bennett (Anytime Goal Scorer) + Jordan Eberle (Anytime Goal Scorer)
- **+1755** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Jack Eichel (Anytime Goal Scorer) + Sam Reinhart (Anytime Goal Scorer) + Bobby McMann (Anytime Goal Scorer)
- **+2535** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Nico Hischier (Anytime Goal Scorer) + Sam Reinhart (Anytime Goal Scorer) + Jordan Eberle (Anytime Goal Scorer)
- **+1524** SGP_PLUS ORGANIC. Winnipeg Jets @ Florida Panthers; New Jersey Devils @ Vegas Golden Knights. leg not attached + Jack Eichel (Anytime Goal Scorer)
- **+406** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Over 1.5 (1st Period Total Goals) + Over 1.5 (1st Period Total Goals) + Over 1.5 (1st Period Total Goals)
- **+5000** PARLAY ORGANIC. New Jersey Devils @ Vegas Golden Knights; Winnipeg Jets @ Florida Panthers; Seattle Kraken @ Calgary Flames. Timo Meier (Anytime Goal Scorer) + Cole Perfetti (Anytime Goal Scorer) + Matvei Gridin (Anytime Goal Scorer)

The rows are in `docs/projections/premade-parlays.json`, `docs/projections/sideline-premade-parlays-2026-10-30.xlsx`, and `docs/projections/sideline-premade-parlays-2026-10-30.csv`.

