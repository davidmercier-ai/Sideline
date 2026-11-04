# Game script

The four reads stay the score. A game script is the personnel and scheme view. It does not enter those reads, the sim, or the book prices, and it does not change a Pass into a Bet.

## Process

1. Write the call from the four reads first.
2. Add a person only with a status, a source, and a date. The statuses are in, out, debut, limited, and questionable.
3. Leave a scheme blank when no source named one. Do not invent a scheme name from the yardage split.
4. An out opens one branch. Name a replacement or a matchup only when the input names that person. Otherwise say the name is missing.
5. A debut or a limited workload opens two branches: the quoted workload, and a full workload. Both still say the old log is not this week's snaps.
6. A site yardage number next to the other team's site allowance is a description. The gap is not an edge.
7. Every branch says what would confirm it and what would kill it.

Run `node scripts/game-script.mjs docs/projections/scripts/2026-11-02-bears-seahawks.json`.

A scouting report can supply the personnel. The report is the source, the date, and what the source said. A matchup is named only when that report names it. See `docs/projections/SCOUTING.md`.
