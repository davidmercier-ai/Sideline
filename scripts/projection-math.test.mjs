import assert from 'node:assert/strict'
import {
  difference,
  grossPassingYards,
  homeMargin,
  impliedFromAmerican,
  inputSynergy,
  marketHomeMargin,
  noVigPair,
  quotePosition,
  medianPair,
  methodConvergence,
  mulberry32,
  simulateMatch,
  playerReads,
  projectRate,
  projectedOutcome,
  comparePlayerReads,
  reconcileTotal,
  sackYardsLost,
  summarize,
  totalDirection,
  decidedRate,
  gradeClosingLine,
  gradeLog,
  summarizeMarks,
  buildAlert,
  betSlipLink,
  draftKingsEventSlug,
  draftKingsPhoneLink,
  draftKingsPhoneLinks,
  draftKingsSlipLink,
  fanDuelSlipLink,
  sportMark,
} from './projection-math.mjs'

const yards = summarize([100, 120, 120, 80, 150])
assert.equal(yards.n, 5)
assert.equal(yards.mean, 114)
assert.equal(yards.median, 120)
assert.deepEqual(yards.modes, [120])
assert.equal(yards.high, 150)
assert.equal(yards.low, 80)

const unique = summarize([10, 20, 30])
assert.deepEqual(unique.modes, [])
assert.equal(unique.modeNote, 'no repeated value')

const empty = summarize([])
assert.equal(empty.missing, true)
assert.equal(empty.median, null)

const paired = projectRate([20, 30], [10, 20])
assert.equal(paired.value, 20)
assert.equal(paired.basis, 'venue-matched means')
assert.equal(paired.incomplete, false)

const incomplete = projectRate([], [14, 16])
assert.equal(incomplete.value, 15)
assert.equal(incomplete.incomplete, true)

assert.equal(sackYardsLost('2-11'), 11)
assert.equal(grossPassingYards(323, 11), 334)
assert.equal(reconcileTotal(86, 323, 409).ok, true)
assert.equal(reconcileTotal(10, 20, 40).ok, false)

assert.equal(homeMargin(29, 26), 3)
assert.equal(marketHomeMargin(-3), 3)
assert.equal(difference(2, 3), -1)
assert.equal(totalDirection(1.2), 'baseline is above the posted total')
assert.equal(totalDirection(-0.4), 'baseline is below the posted total')
assert.equal(projectedOutcome('Bills', 'Ravens', 24.5, 22), 'Bills')
assert.equal(projectedOutcome('Bills', 'Ravens', 21, 21), 'projected tie')

const gameTotals = [300, 400, 500]
const rushMedians = summarize([100, 110, 90]).median
const passMedians = summarize([200, 210, 190]).median
assert.notEqual(summarize(gameTotals).median, rushMedians + passMedians)

const medians = medianPair([10, 30, 20], [12, 18])
assert.equal(medians.value, (20 + 15) / 2)
assert.equal(medians.basis, 'average of the two venue medians')
assert.equal(medianPair([], [1, 2]).incomplete, true)

const agreement = methodConvergence([
  { margin: 2, total: 40 },
  { margin: 1, total: 42 },
  { margin: -3, total: 39 },
])
assert.equal(agreement.side, 'split')
assert.equal(agreement.counts.home, 2)
assert.equal(agreement.counts.away, 1)
assert.equal(agreement.marginRange, 5)

const converged = methodConvergence([
  { margin: 2, total: 10 },
  { margin: 4, total: 12 },
])
assert.equal(converged.unanimous, true)
assert.equal(converged.side, 'home')
assert.equal(converged.totalRange, 2)

assert.equal(inputSynergy(12, 10, 11, 9).status, 'reinforce')
assert.equal(inputSynergy(12, 10, 8, 9).status, 'diverge')
assert.equal(inputSynergy(null, 10, 8, 9).status, 'missing-input')

assert.equal(roundPct(impliedFromAmerican(-175)), 63.6)
assert.equal(roundPct(impliedFromAmerican(145)), 40.8)
const priced = noVigPair('+145', '-175')
assert.ok(Math.abs(priced.away + priced.home - 1) < 1e-9)
assert.ok(priced.hold > 0)
assert.equal(quotePosition(3, [-5, -1.2, 2, 3.5]), 'inside-method-range')
assert.equal(quotePosition(12.5, [1, 2, 4, 7]), 'outside-method-range')
assert.equal(quotePosition(null, [1, 2]), 'missing-input')

const sim = simulateMatch({
  awayFor: [10, 20],
  homeAgainst: [10, 20],
  homeFor: [30, 40],
  awayAgainst: [30, 40],
  random: mulberry32(20261030),
  draws: 200,
  homeMarginLine: 0,
  totalLine: 50,
})
assert.equal(sim.ok, true)
assert.equal(sim.draws, 200)
assert.ok(sim.homeWinRate > 0.9)
const again = simulateMatch({
  awayFor: [10, 20],
  homeAgainst: [10, 20],
  homeFor: [30, 40],
  awayAgainst: [30, 40],
  random: mulberry32(20261030),
  draws: 200,
  homeMarginLine: 0,
  totalLine: 50,
})
assert.equal(again.homeWinRate, sim.homeWinRate)
assert.equal(simulateMatch({ awayFor: [], homeAgainst: [1], homeFor: [1], awayAgainst: [1], random: mulberry32(1), draws: 10 }).ok, false)

const games = [
  { date: '2026-10-01', venue: 'home', value: 30 },
  { date: '2026-10-08', venue: 'away', value: 22 },
  { date: '2026-10-15', venue: 'home', value: 28 },
  { date: '2026-10-22', venue: 'away', value: 24 },
]
const homeReads = playerReads(games, 'home')
assert.equal(homeReads[0].name, 'Venue mean')
assert.equal(homeReads[0].value, 29)
assert.equal(homeReads[1].value, 26)
assert.equal(homeReads[2].value, 29)
assert.equal(playerReads(games, null)[0].missing, true)
const over = comparePlayerReads(homeReads, 20, { direction: 'over' })
assert.equal(over.stance, 'with')
assert.equal(over.weight, 1)
const under = comparePlayerReads(homeReads, 40, { direction: 'over' })
assert.equal(under.stance, 'against')
const binary = comparePlayerReads(
  playerReads(
    [
      { date: '2026-10-01', venue: 'home', value: 1 },
      { date: '2026-10-08', venue: 'home', value: 1 },
      { date: '2026-10-15', venue: 'home', value: 0 },
      { date: '2026-10-22', venue: 'away', value: 0 },
    ],
    'home',
  ),
  0.5,
  { binary: true },
)
assert.equal(binary.stance, 'with')
assert.equal(comparePlayerReads(playerReads([], 'home'), 10).status, 'unrated')

const homeGames = [
  { date: '2026-09-12T18:00:00Z', venue: 'home', opponent: 'SDSU', pointsFor: 28, pointsAgainst: 10 },
  { date: '2026-09-20T18:00:00Z', venue: 'home', opponent: 'PUR', pointsFor: 52, pointsAgainst: 38 },
  { date: '2026-10-17T18:00:00Z', venue: 'home', opponent: 'WIS', pointsFor: 17, pointsAgainst: 7 },
  { date: '2026-10-24T18:00:00Z', venue: 'home', opponent: 'MSU', pointsFor: 28, pointsAgainst: 10 },
  { date: '2026-09-06T18:00:00Z', venue: 'away', opponent: 'CAL', pointsFor: 45, pointsAgainst: 20 },
]
const homeGrade = gradeLog(homeGames, { matchVenue: 'home', spread: 22.5, total: 42.5, side: 'home' })
assert.equal(homeGrade.matched, 4)
assert.deepEqual(homeGrade.spread, { cover: 0, miss: 4, push: 0, decided: 4, coverPct: 0 })
assert.equal(homeGrade.games.find((game) => game.opponent === 'CAL').spreadResult, null)

const awayGrade = gradeLog(
  [
    { date: '2026-09-19', venue: 'away', opponent: 'MTSU', pointsFor: 20, pointsAgainst: 27 },
    { date: '2026-10-10', venue: 'away', opponent: 'UTEP', pointsFor: 30, pointsAgainst: 13 },
    { date: '2026-10-17', venue: 'away', opponent: 'NDSU', pointsFor: 17, pointsAgainst: 31 },
  ],
  { matchVenue: 'away', spread: 22.5, total: 42.5, side: 'away' },
)
assert.deepEqual(awayGrade.spread, { cover: 3, miss: 0, push: 0, decided: 3, coverPct: 1 })
assert.deepEqual(awayGrade.total, { over: 3, under: 0, push: 0, decided: 3, overPct: 1, underPct: 0 })

const push = gradeLog(
  [{ date: '2026-10-01', venue: 'home', opponent: 'X', pointsFor: 30, pointsAgainst: 7.5 }],
  { matchVenue: 'home', spread: 22.5, total: 37.5, side: 'home' },
)
assert.equal(push.spread.push, 1)
assert.equal(push.total.push, 1)
assert.equal(gradeLog(homeGames, { matchVenue: 'home', side: 'home' }).spread, null)

const neutral = gradeLog(homeGames, { matchVenue: 'overall', spread: 22.5, side: 'home' })
assert.equal(neutral.matched, 5)
assert.equal(neutral.spread.cover, 1)
assert.equal(decidedRate(1, 0), null)

const homeCover = gradeClosingLine({ pointsFor: 27, pointsAgainst: 6, venue: 'home', homeSpread: -3.5, total: 38.5 })
assert.equal(homeCover.spreadResult, 'cover')
assert.equal(homeCover.totalResult, 'under')
const awayMiss = gradeClosingLine({ pointsFor: 6, pointsAgainst: 27, venue: 'away', homeSpread: -3.5, total: 38.5 })
assert.equal(awayMiss.spreadResult, 'miss')
assert.equal(gradeClosingLine({ pointsFor: 24, pointsAgainst: 20.5, venue: 'home', homeSpread: -3.5, total: 44.5 }).spreadResult, 'push')
assert.equal(gradeClosingLine({ pointsFor: 10, pointsAgainst: 7, venue: 'neutral', homeSpread: -3, total: 17 }).spreadResult, null)

const rolled = summarizeMarks([
  { league: 'nfl', teamId: '23', team: 'Steelers', spreadResult: 'cover', totalResult: 'under' },
  { league: 'nfl', teamId: '23', team: 'Steelers', spreadResult: 'miss', totalResult: 'over' },
  { league: 'nfl', teamId: '23', team: 'Steelers', spreadResult: 'push', totalResult: 'push' },
])
assert.equal(rolled.length, 1)
assert.equal(rolled[0].spread.coverPct, 0.5)
assert.equal(rolled[0].spread.decided, 2)
assert.equal(rolled[0].total.overPct, 0.5)
assert.equal(rolled[0].total.underPct, 0.5)

function roundPct(value) {
  return Math.round(value * 1000) / 10
}

const { gameLogSection } = await import('./project-slate.mjs')
const section = gameLogSection(
  {
    neutral: false,
    away: { name: 'Nevada' },
    home: { name: 'UCLA' },
    market: { marketHomeMargin: 22.5, total: 42.5 },
    extra: {},
  },
  [
    { date: '2026-09-19T18:00:00Z', venue: 'away', opponent: 'MTSU', pointsFor: 20, pointsAgainst: 27 },
    { date: '2026-10-10T18:00:00Z', venue: 'home', opponent: 'WKU', pointsFor: 49, pointsAgainst: 14 },
  ],
  homeGames,
).join('\n')
assert.ok(section.includes('**5. Game log against the posted number**'))
assert.ok(section.includes('| 2026-09-19 | away | MTSU | 20-27 | -7 | 47 | yes |'))
assert.ok(section.includes('| 2026-09-06 | away | CAL | 45-20 | +25 | 65 | no |'))
assert.ok(section.includes('Nevada away: cover 1, miss 0, push 0'))
assert.ok(section.includes('UCLA home: cover 0, miss 4, push 0'))
assert.ok(section.includes('FanDuel spread. Nevada away: missing, so no count'))

const { mkdtemp, readFile } = await import('node:fs/promises')
const { tmpdir } = await import('node:os')
const { join } = await import('node:path')
const { saveBoard, loadBoard } = await import('./board-store.mjs')
const storeDir = await mkdtemp(join(tmpdir(), 'boards-'))
const stored = await saveBoard({
  id: 'j1-mixed-2026-10-31',
  title: 'J1 mixed card',
  sportPath: 'soccer/jpn.1',
  retrievedAt: '2026-10-31T20:00:00.000Z',
  games: [{ away: 'FC Tokyo', home: 'Okayama', final: '4-0', result: 'hit' }],
}, storeDir)
const loaded = await loadBoard('j1-mixed-2026-10-31', storeDir)
assert.equal(loaded.games[0].result, 'hit')
const index = JSON.parse(await readFile(join(storeDir, 'index.json'), 'utf8'))
assert.equal(index[0].games, 1)
assert.ok(stored.endsWith('j1-mixed-2026-10-31.json'))

assert.equal(sportMark('football/nfl'), '🏈')
assert.equal(sportMark('soccer/jpn.1'), '⚽')
assert.equal(sportMark('basketball/nba'), '🏀')
assert.equal(sportMark('hockey/nhl'), '🏒')
assert.equal(sportMark('baseball/mlb'), '⚾')

const valueAlert = buildAlert({
  sportPath: 'football/nfl',
  away: 'Away',
  home: 'Home',
  when: 'Sun 1:00 PM ET',
  methods: [{ margin: 8, total: 40 }, { margin: 7, total: 41 }, { margin: 6, total: 39 }, { margin: 9, total: 42 }],
  marketHomeMargin: 3,
  postedTotal: 44,
})
assert.equal(valueAlert.rating, 5)
assert.equal(valueAlert.reason, 'value')
assert.equal(valueAlert.action, 'Bet')
assert.ok(valueAlert.text.startsWith('🏈 🟢 5 💰 Bet Home.'))
assert.ok(valueAlert.text.includes('Game: Away at Home'))

const soon = buildAlert({
  sportPath: 'soccer/jpn.1',
  away: 'Kawasaki',
  home: 'Yokohama',
  when: 'Sun 12:00 AM ET',
  kickoff: '2026-11-01T04:10:00.000Z',
  now: '2026-11-01T04:00:00.000Z',
  methods: [{ margin: -0.2, total: 2.2 }, { margin: 0.1, total: 2.4 }, { margin: -0.4, total: 2.1 }, { margin: -0.3, total: 2.6 }],
  postedTotal: 3.5,
})
assert.equal(soon.action, 'Bet now')
assert.equal(soon.bet, 'Under 3.5')
assert.ok(soon.text.startsWith('⚽'))

const split = buildAlert({
  sportPath: 'basketball/nba',
  away: 'Away',
  home: 'Home',
  methods: [{ margin: 4, total: 220 }, { margin: -3, total: 210 }, { margin: 1, total: 215 }, { margin: -2, total: 218 }],
})
assert.equal(split.action, 'Pass')
assert.equal(split.reason, 'split')
assert.ok(split.text.includes('🏀'))

const prop = buildAlert({
  sportPath: 'soccer/jpn.1',
  away: 'Tokyo Verdy',
  home: 'V-Varen',
  when: 'Sun 1:00 AM ET',
  methods: [{ margin: 0.4, total: 2 }, { margin: 0.3, total: 2 }, { margin: 0.2, total: 2 }, { margin: -0.2, total: 2 }],
  gameText: 'Matheus Jesus anytime. Tokyo Verdy at V-Varen, Sun 1:00 AM ET',
})
assert.ok(prop.text.includes('Tokyo Verdy at V-Varen, Sun 1:00 AM ET'))

const scar = buildAlert({
  sportPath: 'hockey/nhl',
  away: 'Away',
  home: 'Home',
  methods: [{ margin: 1.2, total: 6 }, { margin: 0.8, total: 6 }, { margin: 0.4, total: 6 }, { margin: -0.3, total: 6 }],
  marketHomeMargin: 0.5,
})
assert.equal(scar.rating, 3)
assert.equal(scar.reason, 'scar')
assert.ok(scar.text.includes('🏒'))

const dkId = '0QA382657149#2341145992_13L88808Q1-549717439Q20'
assert.equal(
  betSlipLink({ book: 'DraftKings', action: 'Bet', eventId: '34118052', selectionId: dkId }),
  'https://sportsbook.draftkings.com/event/34118052?outcomes=0QA382657149%232341145992_13L88808Q1-549717439Q20',
)
assert.equal(
  betSlipLink({ book: 'FanDuel', action: 'Bet now', marketId: '739.194351327', selectionId: '42200635' }),
  'https://sportsbook.fanduel.com/addToBetslip?marketId=739.194351327&selectionId=42200635',
)
assert.equal(betSlipLink({ book: 'DraftKings', action: 'Lean', eventId: '34118052', selectionId: dkId }), null)
assert.equal(draftKingsSlipLink([dkId, '0QA2#3'], 'Bet'), null)
assert.equal(draftKingsEventSlug('SJ Sharks @ LA Kings'), 'sj-sharks-%40-la-kings')
assert.equal(
  draftKingsSlipLink([dkId, '0QA2#3'], 'Bet', ['34118045', '34118045'], 'SJ Sharks @ LA Kings'),
  'https://sportsbook.draftkings.com/event/sj-sharks-%40-la-kings/34118045?outcomes=0QA382657149%232341145992_13L88808Q1-549717439Q20,0QA2%233',
)
assert.equal(
  draftKingsSlipLink([dkId, '0QA2#3'], 'Bet', ['34118045', '34118184']),
  'https://sportsbook.draftkings.com/event/34118045?outcomes=0QA382657149%232341145992_13L88808Q1-549717439Q20,0QA2%233',
)
const webSlip = draftKingsSlipLink([dkId, '0QA2#3'], 'Bet', ['34118045', '34118045'], 'SJ Sharks @ LA Kings')
const webOutcomes = new URL(webSlip).searchParams.get('outcomes').split(/[,|+\s]+/).filter(Boolean)
assert.deepEqual(webOutcomes, [dkId, '0QA2#3'])
assert.equal(draftKingsPhoneLink(['0OU87064453U650_3', '0HC87064453P150_3'], 'Bet'), null)
assert.deepEqual(draftKingsPhoneLinks(['0OU87064453U650_3', dkId], 'Bet'), [
  'dksb://sb/addbet/0OU87064453U650_3',
  'dksb://sb/addbet/0QA382657149%232341145992_13L88808Q1-549717439Q20',
])
assert.equal(draftKingsPhoneLink(['0OU87064453U650_3'], 'Bet'), 'dksb://sb/addbet/0OU87064453U650_3')
assert.deepEqual(draftKingsPhoneLinks([dkId], 'Lean'), [])
assert.equal(draftKingsPhoneLink([dkId], 'Lean'), null)
assert.equal(draftKingsSlipLink([dkId], 'Lean'), null)
const fdSlip = fanDuelSlipLink([
  { marketId: '739.194644207', selectionId: '41173071' },
  { marketId: '739.194851132', selectionId: '49541845' },
])
assert.equal(
  fdSlip,
  'https://sportsbook.fanduel.com/addToBetslip?marketId[0]=739.194644207&selectionId[0]=41173071&marketId[1]=739.194851132&selectionId[1]=49541845',
)
assert.equal(fdSlip.includes('%5B'), false)
assert.equal(fanDuelSlipLink([{ marketId: '739.194644207', selectionId: '41173071' }], 'Lean'), null)
assert.equal(fanDuelSlipLink([{ marketId: '739.194644207', selectionId: '' }]), null)
assert.equal(fanDuelSlipLink([]), null)
assert.equal(betSlipLink({ book: 'DraftKings', action: 'Pass', eventId: '34118052', selectionId: dkId }), null)

const linked = buildAlert({
  sportPath: 'football/nfl',
  away: 'Browns',
  home: 'Steelers',
  when: 'Sun 1:00 PM ET',
  methods: [{ margin: 8, total: 40 }, { margin: 7, total: 41 }, { margin: 6, total: 39 }, { margin: 9, total: 42 }],
  marketHomeMargin: 3,
  slip: { book: 'DraftKings', eventId: '34118052', selectionId: dkId },
})
assert.equal(linked.action, 'Bet')
assert.equal(linked.link, betSlipLink({ book: 'DraftKings', action: 'Bet', eventId: '34118052', selectionId: dkId }))
assert.ok(!linked.text.includes('http'))

const leaned = buildAlert({
  sportPath: 'football/nfl',
  away: 'Away',
  home: 'Home',
  methods: [{ margin: 1, total: 40 }],
  thin: true,
  slip: { book: 'DraftKings', eventId: '34118052', selectionId: dkId },
})
assert.equal(leaned.action, 'Lean')
assert.equal(leaned.link, null)

console.log('projection math ok')
