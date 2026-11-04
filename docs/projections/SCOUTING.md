# Scouting reports

A scouting report is its own store. It does not enter the four models. It can feed a game script, and it can feed a second sim that stays labeled apart from the base sim.

The store is `docs/projections/scouting/reports.json`. Each report has an id, a source, a date, and what the source said. A status is the filing label for the script: in, out, debut, limited, or questionable. A bench note stays a bench note. It is not filed as out.

A report may name a team and a date to leave out of the scouted sim. The base sim still uses the full list. If a drop empties a list, the scouted sim does not run and the base sim stands. A scouted list under 3 games is still marked thin. A report with no source or no date cannot drop a game. A snap share is not stored and is not applied.

Emanuel Wilson's two-carry game is a reading of the log. It is not in this store, and it is not a dropped date.

The Monday file `docs/projections/scripts/2026-11-02-bears-seahawks.json` is the assembled script, including a matchup the separate reports do not claim a source named. The J1 notes from November 1, 2026 are filed from `docs/projections/scouting/2026-11-01-j1.md`. The action column on that page is not part of the report.

Run `node scripts/scouting-reports.mjs docs/projections/scouting/reports.json`.
