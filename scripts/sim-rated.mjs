/**
 * Play the statline sim with published skill ratings.
 * Volume stays the player's own games. Ratings move the make, the completion,
 * the save, and the yards. A missing rating leaves that rate alone.
 *
 * node scripts/sim-rated.mjs
 */

import { writeFile } from 'node:fs/promises'
import { mulberry32 } from './projection-math.mjs'
import {
  indexRatings,
  loadEaRatings,
  loadNba2k,
  loadShowCard,
  loadShowLiveIndex,
  meanSkill,
  ratingName,
  searchFc,
} from './game-ratings.mjs'
import { blendRating, nbaGamesFromLog, nflGamesFromLog, simulateNbaBox, simulateNflBox } from './statline-sim.mjs'

const ESPN = 'https://site.api.espn.com'
const headers = { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' }

async function getJson(url) {
  let last
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return response.json()
    } catch (error) {
      last = error
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
  throw last
}

async function pool(items, limit, worker) {
  const results = []
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

function numSkill(card, ...keys) {
  return meanSkill(keys.map((key) => card?.stats?.[key]))
}

function attachNfl(players, ratings, opponents) {
  const cards = opponents.map((player) => ratings.get(ratingName(player.name))).filter(Boolean)
  const coverage = meanSkill(cards.map((card) => numSkill(card, 'manCoverage', 'zoneCoverage')).filter((value) => value >= 50))
  const tackle = meanSkill(cards.map((card) => card.stats.tackle).filter((value) => value >= 50))
  return players.map((player) => {
    const card = ratings.get(ratingName(player.name))
    if (!card) return { ...player, rating: null }
    return {
      ...player,
      rating: card,
      skills: {
        throwAcc: numSkill(card, 'throwAccuracyShort', 'throwAccuracyMid', 'throwAccuracyDeep'),
        coverage,
        speed: card.stats.speed,
        bc: numSkill(card, 'bCVision', 'speed', 'breakTackle'),
        tackle,
        kick: card.stats.kickAccuracy,
      },
    }
  })
}

function attachNba(players, ratings, opponents) {
  const cards = opponents.map((player) => ratings.get(ratingName(player.name))).filter(Boolean)
  const contestThree = meanSkill(cards.map((card) => card.stats.perimeterDefense))
  const contestInside = meanSkill(cards.map((card) => card.stats.interiorDefense))
  return players.map((player) => {
    const card = ratings.get(ratingName(player.name))
    if (!card) return { ...player, rating: null }
    return {
      ...player,
      rating: card,
      skills: {
        three: card.stats.ThreePointShot,
        inside: numSkill(card, 'closeShot', 'midRangeShot', 'drivingLayup'),
        ft: card.stats.FreeThrow,
        contestThree,
        contestInside,
      },
    }
  })
}

async function nflRoster(teamId) {
  const schedule = await getJson(`${ESPN}/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`)
  const done = [...(schedule.events || [])].reverse().find((event) => {
    const type = Number(event.seasonType?.type ?? event.season?.type)
    return event.competitions?.[0]?.status?.type?.completed && Number(event.season?.year) === 2026 && type === 2
  })
  if (!done) return []
  const summary = await getJson(`${ESPN}/apis/site/v2/sports/football/nfl/summary?event=${done.id}`)
  const group = (summary.boxscore?.players || []).find((item) => String(item.team?.id) === String(teamId))
  const players = []
  const seen = new Set()
  for (const stat of group?.statistics || []) {
    if (!/passing|rushing|receiving|kicking/i.test(stat.name || '')) continue
    for (const athlete of stat.athletes || []) {
      const id = athlete.athlete?.id
      const name = athlete.athlete?.displayName
      if (!id || !name || seen.has(String(id))) continue
      seen.add(String(id))
      players.push({ id: String(id), name })
    }
  }
  return players
}

async function nbaRoster(teamId) {
  const schedule = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule`)
  const done = [...(schedule.events || [])].reverse().find((event) => {
    const type = Number(event.seasonType?.type ?? event.season?.type)
    return event.competitions?.[0]?.status?.type?.completed && Number(event.season?.year) >= 2026 && type === 2
  })
  if (!done) return []
  const summary = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/summary?event=${done.id}`)
  const group = (summary.boxscore?.players || []).find((item) => String(item.team?.id) === String(teamId))
  const players = []
  const seen = new Set()
  for (const stat of group?.statistics || []) {
    const keys = stat.keys || []
    const minutesAt = keys.indexOf('minutes')
    for (const athlete of stat.athletes || []) {
      const id = athlete.athlete?.id
      const name = athlete.athlete?.displayName
      if (!id || !name || seen.has(String(id))) continue
      if (minutesAt >= 0 && !(Number(athlete.stats?.[minutesAt]) > 0)) continue
      seen.add(String(id))
      players.push({ id: String(id), name })
    }
  }
  return players
}

async function withNflLog(player, venue) {
  const data = await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${player.id}/gamelog`)
  const games = nflGamesFromLog(data)
  const slice = games.filter((game) => game.venue === venue)
  return { name: player.name, games: slice.length >= 3 ? slice : games }
}

async function withNbaLog(player, venue) {
  const data = await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${player.id}/gamelog`)
  const games = nbaGamesFromLog(data)
  const slice = games.filter((game) => game.venue === venue)
  return { name: player.name, games: slice.length >= 3 ? slice : games }
}

function simulateShots({ shots, madeRate, offense, defense, random }) {
  const rate = blendRating(madeRate, offense, defense)
  if (rate == null || !(shots > 0)) return null
  let made = 0
  for (let i = 0; i < shots; i += 1) if (random() < rate) made += 1
  return { shots, made, rate }
}

async function countingLog(name, league, path) {
  const search = await getJson(`https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=5&type=player`)
  const hit = (search.items || []).find((item) => item.league === league) || (search.items || []).find((item) => ratingName(item.displayName) === ratingName(name))
  if (!hit) return null
  const data = await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/${path}/athletes/${hit.id}/gamelog`)
  const seasons = data.seasonTypes || []
  const season = seasons.find((item) => /2026|2027/.test(item.displayName || '') && /Regular/i.test(item.displayName || ''))
    || seasons.find((item) => /2026|2027/.test(item.displayName || '') && !/preseason|playoff/i.test(item.displayName || ''))
  const names = data.names || []
  const rows = []
  for (const category of season?.categories || []) {
    if (category.type !== 'event') continue
    for (const event of category.events || []) rows.push(event.stats || [])
  }
  const col = (stats, key) => {
    const index = names.indexOf(key)
    if (index < 0) return 0
    const value = Number(stats[index])
    return Number.isFinite(value) ? value : 0
  }
  return { name: hit.displayName, season: season?.displayName || null, games: rows.length, names, rows, col }
}

async function main() {
  process.stderr.write('ratings\n')
  const [madden, nhl, nba, show] = await Promise.all([
    loadEaRatings('madden-nfl'),
    loadEaRatings('nhl'),
    loadNba2k(),
    loadShowLiveIndex(),
  ])
  const maddenByName = indexRatings(madden.players)
  const nhlByName = indexRatings(nhl.players)
  const nbaByName = indexRatings(nba.players)
  const showByName = indexRatings(show.players)
  process.stderr.write(`madden ${madden.players.length} nhl ${nhl.players.length} 2k ${nba.players.length} show ${show.players.length}\n`)

  const lines = [
    '# Rated statline sim',
    '',
    `Retrieved ${new Date().toISOString()} UTC.`,
    '',
    `${madden.source}. ${madden.players.length} players.`,
    `EA NHL ratings page. ${nhl.players.length} players.`,
    `${nba.source}. ${nba.players.length} current players.`,
    `${show.source}. ${show.players.length} Live cards.`,
    'EA FC ratings are read by name from the EA FC ratings page.',
    '',
    'Volume is the player\'s own games. A skill rating moves that rate by 0.4 percentage points per rating point against the defender. With no defender, the scale midpoint is 75 and the move is half of that. A missing rating leaves the rate alone. No rating is invented. No book price is read.',
    '',
  ]

  const nflBoard = await getJson(`${ESPN}/apis/site/v2/sports/football/nfl/scoreboard?dates=20261108`)
  const nflEvent = nflBoard.events.find((event) => /CIN/.test(event.shortName))
  const nflComp = nflEvent.competitions[0]
  const nflAway = nflComp.competitors.find((side) => side.homeAway === 'away')
  const nflHome = nflComp.competitors.find((side) => side.homeAway === 'home')
  const [cinIds, atlIds] = await Promise.all([nflRoster(nflAway.team.id), nflRoster(nflHome.team.id)])
  const cin = await pool(cinIds, 6, (player) => withNflLog(player, 'away'))
  const atl = await pool(atlIds, 6, (player) => withNflLog(player, 'home'))
  const cinRated = attachNfl(cin.filter((player) => player.games.length), maddenByName, atl)
  const atlRated = attachNfl(atl.filter((player) => player.games.length), maddenByName, cin)
  const nflBox = simulateNflBox({ home: atlRated, away: cinRated, draws: 2000, seed: 20261108 })
  lines.push('## Madden NFL 27 — Bengals at Falcons')
  lines.push('')
  lines.push(`Median score ${nflBox.awayMedian}-${nflBox.homeMedian}. Ratings found for ${[...cinRated, ...atlRated].filter((player) => player.rating).length} of ${cinRated.length + atlRated.length} players.`)
  lines.push('')
  lines.push('| Player | OVR | Throw / speed / kick | CMP-ATT | YDS | TD | CAR | YDS | REC-TGT | YDS |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const player of [...nflBox.away, ...nflBox.home]) {
    const rated = [...cinRated, ...atlRated].find((item) => item.name === player.name)
    if (!rated?.rating) continue
    if (player.att + player.car + player.tgt < 3) continue
    const card = rated.rating
    const skillText = [card.stats.throwAccuracyMid, card.stats.speed, card.stats.kickAccuracy].map((value) => value ?? '—').join(' / ')
    lines.push(`| ${player.name} | ${card.overall} | ${skillText} | ${player.cmp}-${player.att} | ${player.passYds} | ${player.passTd} | ${player.car} | ${player.rushYds} | ${player.rec}-${player.tgt} | ${player.recYds} |`)
  }
  lines.push('')

  const nbaBoard = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261107`)
  const nbaEvent = nbaBoard.events.find((event) => /GS|Warriors/.test(event.shortName + event.name))
  const nbaComp = nbaEvent.competitions[0]
  const nbaAway = nbaComp.competitors.find((side) => side.homeAway === 'away')
  const nbaHome = nbaComp.competitors.find((side) => side.homeAway === 'home')
  const [magicIds, warriorIds] = await Promise.all([nbaRoster(nbaAway.team.id), nbaRoster(nbaHome.team.id)])
  const magic = await pool(magicIds, 6, (player) => withNbaLog(player, 'away'))
  const warriors = await pool(warriorIds, 6, (player) => withNbaLog(player, 'home'))
  const magicRated = attachNba(magic.filter((player) => player.games.length), nbaByName, warriors)
  const warriorsRated = attachNba(warriors.filter((player) => player.games.length), nbaByName, magic)
  const nbaSim = simulateNbaBox({ home: warriorsRated, away: magicRated, draws: 2000, seed: 20261107 })
  lines.push('## NBA 2K27 — Magic at Warriors')
  lines.push('')
  lines.push(`Median score ${nbaSim.awayMedian}-${nbaSim.homeMedian}. Ratings found for ${[...magicRated, ...warriorsRated].filter((player) => player.rating).length} of ${magicRated.length + warriorsRated.length} players.`)
  lines.push('')
  lines.push('| Player | OVR | Three / close / free throw | FG | 3PT | FT | REB | AST | PTS |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const player of [...nbaSim.away, ...nbaSim.home].sort((a, b) => b.pts - a.pts)) {
    const rated = [...magicRated, ...warriorsRated].find((item) => item.name === player.name)
    if (!rated?.rating || player.fga + player.fta < 2) continue
    const card = rated.rating
    const skillText = [card.stats.ThreePointShot, card.stats.closeShot, card.stats.FreeThrow].map((value) => value ?? '—').join(' / ')
    lines.push(`| ${player.name} | ${card.overall} | ${skillText} | ${player.fgm}-${player.fga} | ${player.fg3m}-${player.fg3a} | ${player.ftm}-${player.fta} | ${player.reb} | ${player.ast} | ${player.pts} |`)
  }
  lines.push('')

  const mcdavid = nhlByName.get(ratingName('Connor McDavid'))
  const helle = nhlByName.get(ratingName('Connor Hellebuyck'))
  lines.push('## EA NHL — McDavid shots')
  lines.push('')
  const mcdavidLog = await countingLog('Connor McDavid', 'nhl', 'hockey/nhl')
  if (mcdavid && helle && mcdavidLog?.games) {
    const goals = mcdavidLog.rows.reduce((sum, row) => sum + mcdavidLog.col(row, 'goals'), 0)
    const shots = mcdavidLog.rows.reduce((sum, row) => sum + mcdavidLog.col(row, 'shotsTotal'), 0)
    const perGame = mcdavidLog.games ? Math.max(1, Math.round(shots / mcdavidLog.games)) : 0
    const shotSkill = numSkill(mcdavid, 'wristshotAccuracy', 'slapshotAccuracy', 'handeye')
    const saveSkill = numSkill(helle, 'glovesideHigh', 'glovesideLow', 'sticksideHigh', 'sticksideLow', 'fiveHole')
    const result = simulateShots({
      shots: perGame,
      madeRate: shots > 0 ? goals / shots : null,
      offense: shotSkill,
      defense: saveSkill,
      random: mulberry32(20261107),
    })
    lines.push(`${mcdavid.name} is ${mcdavid.overall} overall. Wrist, slap, and hand-eye average ${shotSkill?.toFixed(0)}.`)
    lines.push(`${helle.name} is ${helle.overall} overall. The five save ratings average ${saveSkill?.toFixed(0)}.`)
    lines.push(`Log: ${goals} goals on ${shots} shots in ${mcdavidLog.games} games (${mcdavidLog.season}). One simulated game uses ${perGame} shots, the rounded per-game shot total.`)
    lines.push(result ? `That game scored ${result.made} on ${result.shots}. The make rate after the ratings is ${(result.rate * 100).toFixed(1)}%.` : 'The shot log did not support a make rate.')
  } else {
    lines.push('McDavid, Hellebuyck, or the shot log was missing.')
  }
  lines.push('')

  const saka = await searchFc('Bukayo Saka')
  const raya = await searchFc('Alisson')
  const sakaLog = await countingLog('Bukayo Saka', 'eng.1', 'soccer/eng.1')
  lines.push('## EA FC — Saka shots')
  lines.push('')
  if (saka && raya && sakaLog?.rows?.length) {
    const goals = sakaLog.rows.reduce((sum, row) => sum + sakaLog.col(row, 'totalGoals'), 0)
    const shots = sakaLog.rows.reduce((sum, row) => sum + sakaLog.col(row, 'totalShots'), 0)
    const perGame = Math.max(1, Math.round(shots / sakaLog.games))
    const keeping = meanSkill([raya.stats.gkDiving, raya.stats.gkHandling, raya.stats.gkReflexes])
    const result = simulateShots({
      shots: perGame,
      madeRate: shots > 0 ? goals / shots : null,
      offense: saka.stats.finishing,
      defense: keeping,
      random: mulberry32(11),
    })
    lines.push(`${saka.name}, ${saka.team}, ${saka.overall} overall, finishing ${saka.stats.finishing}.`)
    lines.push(`${raya.name}, ${raya.team}, ${raya.overall} overall, diving ${raya.stats.gkDiving}, handling ${raya.stats.gkHandling}, reflexes ${raya.stats.gkReflexes}.`)
    lines.push(`Log: ${goals} goals on ${shots} shots in ${sakaLog.games} games (${sakaLog.season}). One simulated game uses ${perGame} shots.`)
    lines.push(result ? `That game scored ${result.made} on ${result.shots}. The make rate after the ratings is ${(result.rate * 100).toFixed(1)}%.` : 'The shot log did not support a make rate.')
  } else {
    lines.push(`Saka card: ${saka ? `${saka.name} ${saka.overall} finishing ${saka.stats.finishing}` : 'missing'}. Keeper card: ${raya ? `${raya.name} ${raya.overall}` : 'missing'}. Shot log games: ${sakaLog?.games ?? 0}.`)
  }
  lines.push('')

  const judgeCard = showByName.get(ratingName('Aaron Judge'))
  const skubalCard = [...show.players].filter((card) => /skubal/i.test(card.name)).sort((a, b) => b.overall - a.overall)[0]
  const judgeLog = await countingLog('Aaron Judge', 'mlb', 'baseball/mlb')
  lines.push('## MLB The Show 26 Live — Judge at-bats')
  lines.push('')
  if (judgeCard && skubalCard && judgeLog?.rows?.length) {
    const [batter, pitcher] = await Promise.all([loadShowCard(judgeCard.uuid), loadShowCard(skubalCard.uuid)])
    const atBats = judgeLog.rows.reduce((sum, row) => sum + judgeLog.col(row, 'atBats'), 0)
    const hits = judgeLog.rows.reduce((sum, row) => sum + judgeLog.col(row, 'hits'), 0)
    const homers = judgeLog.rows.reduce((sum, row) => sum + judgeLog.col(row, 'homeRuns'), 0)
    const perGame = Math.max(1, Math.round(atBats / judgeLog.games))
    const contact = meanSkill([batter.stats.contact_left, batter.stats.contact_right])
    const power = meanSkill([batter.stats.power_left, batter.stats.power_right])
    const miss = meanSkill([pitcher.stats.k_per_bf_left, pitcher.stats.k_per_bf_right])
    const hitRate = blendRating(atBats > 0 ? hits / atBats : null, contact, miss)
    const homerGivenHit = blendRating(hits > 0 ? homers / hits : null, power, null)
    const random = mulberry32(26)
    let simHits = 0
    let simHomers = 0
    for (let i = 0; i < perGame; i += 1) {
      if (hitRate != null && random() < hitRate) {
        simHits += 1
        if (homerGivenHit != null && random() < homerGivenHit) simHomers += 1
      }
    }
    lines.push(`${batter.name}, ${batter.team}, ${batter.overall} overall. Contact ${contact?.toFixed(0)}, power ${power?.toFixed(0)}.`)
    lines.push(`${pitcher.name}, ${pitcher.team}, ${pitcher.overall} overall. Strikeout rating versus left and right averages ${miss?.toFixed(0)}.`)
    lines.push(`Log: ${hits} hits and ${homers} home runs in ${atBats} at-bats over ${judgeLog.games} games (${judgeLog.season}). One simulated game uses ${perGame} at-bats.`)
    lines.push(`That game: ${simHits} hits, ${simHomers} home runs.`)
  } else {
    lines.push(`Judge card: ${judgeCard ? judgeCard.overall : 'missing'}. Skubal card: ${skubalCard ? skubalCard.overall : 'missing'}. At-bat log games: ${judgeLog?.games ?? 0}.`)
  }
  lines.push('')

  const out = 'docs/projections/2026-11-07-rated-sim.md'
  await writeFile(out, `${lines.join('\n')}\n`)
  process.stderr.write(`wrote ${out}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
