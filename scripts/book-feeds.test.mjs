import assert from 'node:assert/strict'
import { impliedFromAmerican, indexDraftKingsFirstScorers, indexDraftKingsProps, indexDraftKingsTeamTotals, indexFanDuelFirstScorers, mergeFirstScorerLines, propsForNames } from './book-prices.mjs'
import { earlierAmerican, latestByBook, leaderPrices, parlayImplied, recordLabel, scoreSide, slateScore } from './grade-slip.mjs'
import { leaderCall } from './first-scorer.mjs'
import { rowsFromProps } from './save-first-scorer-lines.mjs'
import { allowanceRead, boardSideCall, boardTotalCall, closestReadGap, coverRole, favoriteSide, predictorSide, quoteFromPickcenter, spreadFromPickcenter, spreadSizeBucket } from './backtest-slate.mjs'
import { alertSignals } from './projection-math.mjs'
import { indexFanDuelProps } from './book-prices.mjs'
import { propBoardCall } from './project-players.mjs'
import { lineBeforeGame, walkForwardProp, walkForwardSaved } from './backtest-players.mjs'
import { playerReads } from './projection-math.mjs'

const totals = indexDraftKingsTeamTotals({
  events: [{ id: '1', name: 'OKC Thunder @ MEM Grizzlies' }],
  markets: [
    { id: 'm1', eventId: '1', name: 'MEM Grizzlies: Team Total Points' },
    { id: 'm2', eventId: '1', name: 'OKC Thunder: Team Total Points' },
  ],
  selections: [
    { marketId: 'm1', label: 'Over', outcomeType: 'Over', points: 110.5, displayOdds: { american: '−105' } },
    { marketId: 'm1', label: 'Under', outcomeType: 'Under', points: 110.5, displayOdds: { american: '−115' } },
    { marketId: 'm2', label: 'Over', outcomeType: 'Over', points: 113.5, displayOdds: { american: '−112' } },
    { marketId: 'm2', label: 'Under', outcomeType: 'Under', points: 113.5, displayOdds: { american: '−108' } },
  ],
})
const grizzlies = [...totals.values()][0]
assert.equal(grizzlies.homeTotal.line, 110.5)
assert.equal(grizzlies.homeTotal.over, '-105')
assert.equal(grizzlies.awayTotal.line, 113.5)

const props = indexDraftKingsProps({
  events: [{ id: '2', name: 'PHI 76ers @ CLE Cavaliers' }],
  markets: [{ id: 'p1', eventId: '2', name: 'Tyrese Maxey Points O/U' }],
  selections: [
    { marketId: 'p1', label: 'Over', outcomeType: 'Over', points: 25.5, displayOdds: { american: '−112' } },
    { marketId: 'p1', label: 'Under', outcomeType: 'Under', points: 25.5, displayOdds: { american: '−114' } },
  ],
}, 'points')
assert.equal(props.length, 1)
assert.equal(props[0].player, 'Tyrese Maxey')
assert.equal(props[0].line, 25.5)
assert.equal(propsForNames(props, ['76ers'], ['Cavaliers']).length, 1)
assert.equal(propsForNames(props, ['Lakers'], ['Celtics']).length, 0)

assert.equal(spreadFromPickcenter({ pickcenter: [{ provider: { name: 'Draft Kings' }, spread: -1.5, overUnder: 41.5 }] }), -1.5)
assert.deepEqual(quoteFromPickcenter({ pickcenter: [{ provider: { name: 'Draft Kings' }, spread: -1.5, overUnder: 41.5 }] }), { spread: -1.5, total: 41.5 })
assert.equal(spreadFromPickcenter({ pickcenter: [{ provider: { name: 'Other' }, spread: 3 }] }), null)
assert.equal(spreadFromPickcenter({}), null)
assert.equal(lineBeforeGame([{ retrievedAt: '2026-11-06T23:00:00Z', line: 20.5 }], '2026-11-05T00:00:00Z'), null)
assert.equal(lineBeforeGame([{ retrievedAt: '2026-11-06T18:00:00Z', line: 20.5 }], '2026-11-07T00:30:00Z'), 20.5)
const savedForward = walkForwardSaved([
  { date: '2026-11-07T00:30:00Z', venue: 'home', value: 30 },
  { date: '2026-11-08T00:30:00Z', venue: 'home', value: 28 },
  { date: '2026-11-09T00:30:00Z', venue: 'home', value: 26 },
  { date: '2026-11-10T00:30:00Z', venue: 'home', value: 32 },
], [{ retrievedAt: '2026-11-06T18:00:00Z', line: 20 }])
assert.equal(savedForward.over.decided, 1)
assert.equal(savedForward.over.hits, 1)

const cleared = [6, 5, 4.5, 7]
assert.equal(boardSideCall({ margins: cleared, marketMargin: 3, room: 1, thin: false }), 'home')
assert.equal(boardSideCall({ margins: [2.2, 5, 4, 7], marketMargin: 3, room: 1, thin: false }), null)
assert.equal(boardSideCall({ margins: cleared, marketMargin: 3, room: 1, thin: true }), null)
assert.equal(boardTotalCall({ totals: [210, 212, 214, 211], postedTotal: 220, room: 1, thin: false }), 'under')
assert.equal(boardTotalCall({ totals: [210, 219.5, 214, 211], postedTotal: 220, room: 1, thin: false }), null)
assert.equal(spreadSizeBucket(-2.5), 'under3')
assert.equal(spreadSizeBucket(8), 'to12')
assert.equal(spreadSizeBucket(14), 'over12')
assert.equal(predictorSide({ awayTeam: { statistics: [{ name: 'gameProjection', value: 62 }] } }), 'away')
assert.equal(predictorSide({}), null)
assert.deepEqual(alertSignals([
  { margin: 1.2 }, { margin: 0.8 }, { margin: 0.4 }, { margin: -0.3 },
], 0.5, false).scar, 'home')
assert.equal(alertSignals([
  { margin: 3 }, { margin: 3 }, { margin: 3 }, { margin: 3 },
], 3, false).onNumber, 'home')
assert.equal(favoriteSide(-3), 'home')
assert.equal(favoriteSide(3), 'away')
assert.equal(favoriteSide(0), null)
assert.equal(coverRole(-1.5, 'home'), 'favorite')
assert.equal(coverRole(-1.5, 'away'), 'dog')
assert.equal(coverRole(1.5, 'home'), 'dog')
assert.equal(coverRole(0, 'home'), null)

const games = [
  { date: '2026-10-22', venue: 'home', value: 30 },
  { date: '2026-10-24', venue: 'home', value: 28 },
  { date: '2026-10-26', venue: 'home', value: 26 },
  { date: '2026-10-28', venue: 'away', value: 24 },
]
assert.equal(propBoardCall(playerReads(games, 'home'), 20), 'over')
assert.equal(propBoardCall(playerReads(games, 'home'), 27), null)
assert.equal(propBoardCall(playerReads(games.slice(0, 2), 'home'), 10), null)

assert.equal(closestReadGap([8, 6, 5, 9], 'home', 3), 2)
assert.equal(closestReadGap([2, 4, 1, 6], 'away', 3), -3)
assert.equal(closestReadGap([4], 'tie', 3), null)

const season = [30, 28, 26, 32, 10].map((value, index) => ({
  date: `2026-10-${20 + index}`,
  venue: 'home',
  value,
}))
const forward = walkForwardProp(season, 20)
assert.equal(forward.over.hits, 1)
assert.equal(forward.over.decided, 2)
assert.equal(forward.under.decided, 0)
const cold = [10, 8, 9, 7].map((value, index) => ({
  date: `2026-10-${20 + index}`,
  venue: 'home',
  value,
}))
const under = walkForwardProp(cold, 20)
assert.equal(under.under.hits, 1)
assert.equal(under.under.decided, 1)
assert.equal(under.over.decided, 0)

const allowed = allowanceRead(
  [
    { venue: 'away', pointsAgainst: 20 },
    { venue: 'away', pointsAgainst: 22 },
    { venue: 'away', pointsAgainst: 24 },
  ],
  [
    { venue: 'home', pointsAgainst: 10 },
    { venue: 'home', pointsAgainst: 12 },
    { venue: 'home', pointsAgainst: 14 },
  ],
)
assert.equal(allowed.thin, false)
assert.equal(allowed.margin, 10)
const fanduelProp = indexFanDuelProps({
  attachments: {
    events: { 9: { name: 'Boston Celtics @ Charlotte Hornets' } },
    markets: {
      a: {
        eventId: 9,
        marketType: 'PLAYER_A_TOTAL_POINTS',
        marketName: 'Jayson Tatum - Points',
        runners: [
          { runnerName: 'Jayson Tatum Over', handicap: 26.5, result: { type: 'OVER' }, winRunnerOdds: { americanDisplayOdds: { americanOdds: -130 } } },
          { runnerName: 'Jayson Tatum Under', handicap: 26.5, result: { type: 'UNDER' }, winRunnerOdds: { americanDisplayOdds: { americanOdds: 102 } } },
        ],
      },
    },
  },
}, 'points', /^PLAYER_[A-Z]_TOTAL_POINTS$/)
assert.equal(fanduelProp.length, 1)
assert.equal(fanduelProp[0].player, 'Jayson Tatum')
assert.equal(fanduelProp[0].line, 26.5)
assert.equal(fanduelProp[0].over, '-130')

const firstDk = indexDraftKingsFirstScorers({
  events: [{ id: '3', name: 'DEN Broncos @ CAR Panthers' }],
  markets: [
    { id: 'f1', eventId: '3', name: 'First TD Scorer' },
    { id: 'a1', eventId: '3', name: 'Anytime TD Scorer' },
  ],
  selections: [
    { id: 's1', marketId: 'f1', label: 'Chuba Hubbard', displayOdds: { american: '+500' } },
    { id: 's2', marketId: 'f1', label: 'No Touchdown Scorer', displayOdds: { american: '+450' } },
    { id: 's3', marketId: 'a1', label: 'Chuba Hubbard', displayOdds: { american: '-115' } },
  ],
}, 'First TD Scorer')
assert.equal(firstDk.length, 1)
assert.equal(firstDk[0].player, 'Chuba Hubbard')
assert.equal(firstDk[0].american, '+500')
assert.equal(firstDk[0].book, 'DraftKings')

const firstFd = indexFanDuelFirstScorers({
  attachments: {
    events: { 4: { name: 'New York Jets @ Kansas City Chiefs' } },
    markets: {
      m: {
        marketId: '739.1',
        eventId: 4,
        marketName: '1st Touchdown Scorer',
        runners: [
          { runnerName: 'Kenyon Sadiq', selectionId: 7, winRunnerOdds: { americanDisplayOdds: { americanOdds: 3000 } } },
        ],
      },
    },
  },
}, '1st Touchdown Scorer')
assert.equal(firstFd[0].american, '+3000')
assert.equal(firstFd[0].book, 'FanDuel')
const stored = mergeFirstScorerLines({ lines: [] }, rowsFromProps(firstFd, '2026-11-07T06:09:00.000Z'))
assert.equal(stored.lines[0].event, 'New York Jets @ Kansas City Chiefs')
assert.equal(mergeFirstScorerLines(stored, rowsFromProps(firstFd, '2026-11-07T06:09:00.000Z')).lines.length, 1)
assert.equal(Math.round(impliedFromAmerican('+500') * 1000), 167)
assert.equal(scoreSide('31–24.7', true), 'lower')
assert.equal(scoreSide('17.4–25.6', false), 'lower')
assert.equal(parlayImplied([0.5, 0.5]), 0.25)
assert.equal(parlayImplied([0.5, null]), null)
const books = latestByBook([
  { player: 'Chuba Hubbard', book: 'DraftKings', american: '+500', retrievedAt: '2026-11-07T06:00:00Z' },
  { player: 'Chuba Hubbard', book: 'DraftKings', american: '+550', retrievedAt: '2026-11-07T06:20:00Z' },
], 'Chuba Hubbard')
assert.equal(books[0].american, '+550')
assert.equal(earlierAmerican([
  { player: 'Chuba Hubbard', book: 'DraftKings', american: '+500', retrievedAt: '2026-11-07T06:00:00Z' },
  { player: 'Chuba Hubbard', book: 'DraftKings', american: '+550', retrievedAt: '2026-11-07T06:20:00Z' },
], 'Chuba Hubbard', 'DraftKings', '2026-11-07T06:20:00Z'), '+500')
assert.equal(earlierAmerican([
  { player: 'Kenyon Sadiq', book: 'DraftKings', american: '+3000', retrievedAt: '2026-11-07T06:09:00Z' },
  { player: 'Kenyon Sadiq', book: 'DraftKings', american: '+3500', retrievedAt: '2026-11-07T06:32:00Z' },
  { player: 'Kenyon Sadiq', book: 'DraftKings', american: '+3500', retrievedAt: '2026-11-07T06:41:00Z' },
], 'Kenyon Sadiq', 'DraftKings', '2026-11-07T06:41:00Z'), '+3000')
assert.equal(slateScore('| 11/8 - 1:00 PM EST | Broncos at Panthers | 31–24.7 | 55.6 | Broncos, 4–0 | 28.5–26.5, Broncos 72.2% |', 'DEN Broncos', 'CAR Panthers').score, '31–24.7')
const priced = leaderPrices([
  { player: 'Chuba Hubbard', book: 'DraftKings', american: '+500', retrievedAt: '2026-11-07T06:09:00Z', event: 'DEN Broncos @ CAR Panthers' },
  { player: 'Chuba Hubbard', book: 'DraftKings', american: '+550', retrievedAt: '2026-11-07T06:40:00Z', event: 'DEN Broncos @ CAR Panthers' },
  { player: 'Saquon Barkley', book: 'DraftKings', american: '+500', retrievedAt: '2026-11-07T06:40:00Z', event: 'NY Giants @ PHI Eagles' },
], { away: 'Broncos', home: 'Panthers' }, 'Chuba Hubbard')
assert.equal(priced.length, 1)
assert.equal(priced[0].american, '+550')
assert.equal(priced[0].prior, '+500')
assert.equal(recordLabel(leaderCall([
  { value: 0.67, missing: false, thin: false },
  { value: 0.43, missing: false, thin: false },
  { value: 1, missing: false, thin: false },
  { value: 0, missing: false, thin: false },
])), 'Pass, pair shape')

console.log('book feeds ok')
