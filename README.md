# Sideline

Field-level MLB companion. Live scores, a dugout-style game page, standings, and a first-pass win lean — the front end for the model that will live beside this repo.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build
npm run preview
```

## What’s here

- **Scoreboard** — today’s MLB slate (ET), live / upcoming / final filters, date rail, watch list
- **Game** — live scorebug, diamond + count, linescore, recent plays, abbreviated box
- **Standings** — AL / NL divisions with games back and run differential
- **Team** — next games, recent results, active roster
- **Sideline lean** — Bill James log5 from season records plus a 4-point home edge
- **NBA threes** — `/nba` board plus game timeline (team 3PT, top shooters, made threes)

Live pages poll the MLB Stats API while games are on. No API key. No backend.

## Data

[MLB Stats API](https://statsapi.mlb.com) for schedule, live feed, standings, and roster. Team marks come from MLB’s public logo CDN. NBA scores, box 3PT, and scoring plays come from ESPN’s public scoreboard/summary feeds.

The lean is a placeholder. When `-prs-mlb-model` is ready, swap `src/lib/lean.ts`.

## Stack

Vite, React 19, TypeScript, React Router. Styled as night grass, chalk, and stadium floodlight — not a sportsbook.
