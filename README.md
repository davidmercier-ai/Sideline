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
- **Sideline lean** — team log5 + 3-point home edge, then a starter ERA tilt (thin samples down-weighted)
- **Public number** — ESPN/DraftKings moneyline, shown de-vigged for comparison only. No bet slip.

Live pages poll while games are on. No API key. No backend.

## Data

[MLB Stats API](https://statsapi.mlb.com) for schedule, live feed, standings, roster, and pitcher season stats. Team marks come from MLB’s public logo CDN. Public moneylines come from ESPN’s scoreboard feed.

When a real model is ready, swap `src/lib/lean.ts`. The UI already accepts `{ home, away }` plus an optional public line.

## Stack

Vite, React 19, TypeScript, React Router. Styled as night grass, chalk, and stadium floodlight — not a sportsbook.
