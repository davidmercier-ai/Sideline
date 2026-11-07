/**
 * Play-by-play statline sim. Separate from the four models and from the
 * team-score resample.
 *
 * Volume is one game that player already played: minutes, shot attempts,
 * free throws, turnovers, carries, targets. Makes, rebounds, assists, steals,
 * blocks, completions, and touchdowns are resolved one play at a time from
 * that player's own rates. A missing rate is not filled with a league average.
 * No book price is read. An opponent does not change a make rate.
 *
 * Run a box: node scripts/sim-box.mjs --date 2026-11-07 --match Warriors
 */

import { mulberry32 } from './projection-math.mjs'

export function splitMade(value) {
  const match = String(value ?? '').match(/^(\d+)-(\d+)$/)
  if (!match) return null
  const made = Number(match[1])
  const attempted = Number(match[2])
  if (attempted < made) return null
  return { made, attempted }
}

export function nbaGamesFromLog(data) {
  const names = data?.names || []
  const at = (name) => names.indexOf(name)
  const need = [
    'fieldGoalsMade-fieldGoalsAttempted',
    'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
    'freeThrowsMade-freeThrowsAttempted',
    'minutes',
    'totalRebounds',
    'assists',
    'blocks',
    'steals',
    'fouls',
    'turnovers',
    'points',
  ]
  if (need.some((name) => at(name) < 0)) return []
  const seasons = data.seasonTypes || []
  const season = seasons.find((item) => /2026|2027/.test(item.displayName || '') && /Regular/i.test(item.displayName || ''))
    || seasons.find((item) => /2026|2027/.test(item.displayName || '') && !/preseason|playoff|postseason/i.test(item.displayName || ''))
  const games = []
  const seen = new Set()
  for (const category of season?.categories || []) {
    if (category.type !== 'event') continue
    for (const event of category.events || []) {
      if (!event.eventId || seen.has(event.eventId)) continue
      seen.add(event.eventId)
      const stats = event.stats || []
      const fg = splitMade(stats[at('fieldGoalsMade-fieldGoalsAttempted')])
      const fg3 = splitMade(stats[at('threePointFieldGoalsMade-threePointFieldGoalsAttempted')])
      const ft = splitMade(stats[at('freeThrowsMade-freeThrowsAttempted')])
      if (!fg || !fg3 || !ft) continue
      const meta = data.events?.[event.eventId] || {}
      const venue = meta.atVs === '@' ? 'away' : meta.atVs === 'vs' ? 'home' : 'neutral'
      games.push({
        date: String(meta.gameDate || event.eventId),
        venue,
        minutes: numberAt(stats, at('minutes')),
        fgm: fg.made,
        fga: fg.attempted,
        fg3m: Math.min(fg3.made, fg.made),
        fg3a: Math.min(fg3.attempted, fg.attempted),
        ftm: ft.made,
        fta: ft.attempted,
        reb: numberAt(stats, at('totalRebounds')),
        ast: numberAt(stats, at('assists')),
        blk: numberAt(stats, at('blocks')),
        stl: numberAt(stats, at('steals')),
        pf: numberAt(stats, at('fouls')),
        to: numberAt(stats, at('turnovers')),
        pts: numberAt(stats, at('points')),
      })
    }
  }
  return games
}

function numberAt(stats, index) {
  const value = Number(stats[index])
  return Number.isFinite(value) ? value : 0
}

function sumOf(games, key) {
  return games.reduce((total, game) => total + (Number(game[key]) || 0), 0)
}

export function nbaProfile(games) {
  const rows = (games || []).filter((game) => Number.isFinite(game.fga) && game.fga >= 0)
  const fga = sumOf(rows, 'fga')
  const fg3a = sumOf(rows, 'fg3a')
  const fgm = sumOf(rows, 'fgm')
  const fg3m = sumOf(rows, 'fg3m')
  const fg2a = Math.max(0, fga - fg3a)
  const fg2m = Math.max(0, fgm - fg3m)
  const fta = sumOf(rows, 'fta')
  const ftm = sumOf(rows, 'ftm')
  return {
    games: rows,
    threeRate: fga > 0 ? fg3a / fga : null,
    fg2Pct: fg2a > 0 ? fg2m / fg2a : null,
    fg3Pct: fg3a > 0 ? fg3m / fg3a : null,
    ftPct: fta > 0 ? ftm / fta : null,
    rebMean: rows.length ? sumOf(rows, 'reb') / rows.length : 0,
    astMean: rows.length ? sumOf(rows, 'ast') / rows.length : 0,
    stlMean: rows.length ? sumOf(rows, 'stl') / rows.length : 0,
    blkMean: rows.length ? sumOf(rows, 'blk') / rows.length : 0,
  }
}

function pickGame(games, random) {
  if (!games.length) return null
  return games[Math.floor(random() * games.length)]
}

function pickWeighted(players, key, random, skip) {
  let total = 0
  for (const player of players) {
    if (player === skip) continue
    total += Math.max(0, player[key] || 0)
  }
  if (total <= 0) return null
  let roll = random() * total
  for (const player of players) {
    if (player === skip) continue
    roll -= Math.max(0, player[key] || 0)
    if (roll <= 0) return player
  }
  return null
}

function emptyNbaBox(name) {
  return {
    name,
    min: 0,
    fgm: 0,
    fga: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    fta: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    to: 0,
    pf: 0,
    pts: 0,
  }
}

function prepareNba(player, random) {
  const profile = nbaProfile(player.games)
  const sample = pickGame(profile.games, random)
  const box = emptyNbaBox(player.name)
  if (!sample) return { ...profile, name: player.name, box, ftaLeft: 0, active: false }
  box.min = sample.minutes
  box.pf = sample.pf
  return {
    ...profile,
    name: player.name,
    box,
    fgaLeft: sample.fga,
    ftaLeft: sample.fta,
    toLeft: sample.to,
    active: true,
  }
}

function historicalSums(players) {
  const totals = { fgm: 0, ast: 0, fga: 0, blk: 0, to: 0, stl: 0 }
  for (const player of players) {
    for (const game of player.games || []) {
      totals.fgm += game.fgm || 0
      totals.ast += game.ast || 0
      totals.fga += game.fga || 0
      totals.blk += game.blk || 0
      totals.to += game.to || 0
      totals.stl += game.stl || 0
    }
  }
  return totals
}

function shotEvents(players) {
  const events = []
  for (const player of players) {
    for (let i = 0; i < (player.fgaLeft || 0); i += 1) events.push({ player, kind: 'shot' })
    for (let i = 0; i < (player.toLeft || 0); i += 1) events.push({ player, kind: 'turnover' })
  }
  return events
}

function interleave(homeEvents, awayEvents, random) {
  const order = []
  let homeAt = 0
  let awayAt = 0
  while (homeAt < homeEvents.length || awayAt < awayEvents.length) {
    const homeLeft = homeEvents.length - homeAt
    const awayLeft = awayEvents.length - awayAt
    if (homeLeft === 0) {
      order.push(awayEvents[awayAt])
      awayAt += 1
      continue
    }
    if (awayLeft === 0) {
      order.push(homeEvents[homeAt])
      homeAt += 1
      continue
    }
    if (random() < homeLeft / (homeLeft + awayLeft)) {
      order.push(homeEvents[homeAt])
      homeAt += 1
    } else {
      order.push(awayEvents[awayAt])
      awayAt += 1
    }
  }
  return order
}

function takeShot(player, random) {
  const three = player.threeRate != null && random() < player.threeRate
  if (three) {
    if (player.fg3Pct == null) return null
    const make = random() < player.fg3Pct
    return { three: true, make, points: make ? 3 : 0 }
  }
  if (player.fg2Pct == null) return null
  const make = random() < player.fg2Pct
  return { three: false, make, points: make ? 2 : 0 }
}

/**
 * One NBA game. Home and away are lists of { name, games }.
 * The play list is the order the shots, turnovers, and free throws resolved.
 */
export function simulateNbaDraw(home, away, random) {
  const homePlayers = home.map((player) => prepareNba(player, random))
  const awayPlayers = away.map((player) => prepareNba(player, random))
  const homeHistory = historicalSums(home)
  const awayHistory = historicalSums(away)
  const plays = []
  const events = interleave(shotEvents(homePlayers), shotEvents(awayPlayers), random)
  for (const event of events) {
    const offense = homePlayers.includes(event.player) ? homePlayers : awayPlayers
    const defense = offense === homePlayers ? awayPlayers : homePlayers
    const defenseHistory = offense === homePlayers ? awayHistory : homeHistory
    const offenseHistory = offense === homePlayers ? homeHistory : awayHistory
    if (event.kind === 'turnover') {
      event.player.box.to += 1
      let text = `${event.player.name} turnover`
      const stealRate = offenseHistory.to > 0 ? Math.min(1, defenseHistory.stl / offenseHistory.to) : 0
      if (stealRate > 0 && random() < stealRate) {
        const thief = pickWeighted(defense, 'stlMean', random)
        if (thief) {
          thief.box.stl += 1
          text += `, ${thief.name} steal`
        }
      }
      plays.push(text)
      continue
    }
    const shot = takeShot(event.player, random)
    if (!shot) continue
    event.player.box.fga += 1
    if (shot.three) event.player.box.fg3a += 1
    let text = `${event.player.name} ${shot.three ? '3PT' : '2PT'} ${shot.make ? 'make' : 'miss'}`
    if (shot.make) {
      event.player.box.fgm += 1
      if (shot.three) event.player.box.fg3m += 1
      event.player.box.pts += shot.points
      const assistRate = offenseHistory.fgm > 0 ? Math.min(1, offenseHistory.ast / offenseHistory.fgm) : 0
      if (assistRate > 0 && random() < assistRate) {
        const passer = pickWeighted(offense, 'astMean', random, event.player)
        if (passer) {
          passer.box.ast += 1
          text += `, ${passer.name} assist`
        }
      }
    } else {
      const blockRate = offenseHistory.fga > 0 ? Math.min(1, defenseHistory.blk / offenseHistory.fga) : 0
      if (blockRate > 0 && random() < blockRate) {
        const blocker = pickWeighted(defense, 'blkMean', random)
        if (blocker) {
          blocker.box.blk += 1
          text += `, ${blocker.name} block`
        }
      }
      const rebounder = pickWeighted([...homePlayers, ...awayPlayers], 'rebMean', random)
      if (rebounder) {
        rebounder.box.reb += 1
        text += `, ${rebounder.name} rebound`
      }
    }
    plays.push(text)
  }
  for (const player of [...homePlayers, ...awayPlayers]) {
    if (!player.ftaLeft || player.ftPct == null) continue
    for (let i = 0; i < player.ftaLeft; i += 1) {
      player.box.fta += 1
      const make = random() < player.ftPct
      if (make) {
        player.box.ftm += 1
        player.box.pts += 1
      }
      plays.push(`${player.name} free throw ${make ? 'make' : 'miss'}`)
    }
  }
  const score = (players) => players.reduce((total, player) => total + player.box.pts, 0)
  return {
    home: homePlayers.map((player) => player.box),
    away: awayPlayers.map((player) => player.box),
    homeScore: score(homePlayers),
    awayScore: score(awayPlayers),
    plays,
  }
}

function medianOf(values) {
  if (!values.length) return null
  const ordered = [...values].sort((a, b) => a - b)
  return ordered[Math.floor(ordered.length / 2)]
}

function medianBox(draws, side) {
  const names = draws[0]?.[side]?.map((player) => player.name) || []
  return names.map((name) => {
    const rows = draws.map((draw) => draw[side].find((player) => player.name === name))
    const line = { name }
    for (const key of ['min', 'fgm', 'fga', 'fg3m', 'fg3a', 'ftm', 'fta', 'reb', 'ast', 'stl', 'blk', 'to', 'pf', 'pts']) {
      line[key] = medianOf(rows.map((row) => row[key]))
    }
    return line
  })
}

export function simulateNbaBox({ home, away, draws = 2000, seed = 1 }) {
  const random = mulberry32(seed)
  const played = []
  for (let i = 0; i < draws; i += 1) played.push(simulateNbaDraw(home, away, random))
  return {
    draws,
    seed,
    home: medianBox(played, 'home'),
    away: medianBox(played, 'away'),
    homeMedian: medianOf(played.map((draw) => draw.homeScore)),
    awayMedian: medianOf(played.map((draw) => draw.awayScore)),
    sample: played[0],
  }
}

export function nflGamesFromLog(data) {
  const names = data?.names || []
  const at = new Map()
  names.forEach((name, index) => {
    if (!at.has(name)) at.set(name, index)
  })
  const seasons = data?.seasonTypes || []
  const season = seasons.find((item) => /2026|2027/.test(item.displayName || '') && /Regular/i.test(item.displayName || ''))
    || seasons.find((item) => /2026|2027/.test(item.displayName || '') && !/preseason|playoff|postseason/i.test(item.displayName || ''))
  const games = []
  const seen = new Set()
  for (const category of season?.categories || []) {
    if (category.type !== 'event') continue
    for (const event of category.events || []) {
      if (!event.eventId || seen.has(event.eventId)) continue
      seen.add(event.eventId)
      const stats = event.stats || []
      const read = (name) => {
        const index = at.get(name)
        if (index == null) return 0
        const value = Number(stats[index])
        return Number.isFinite(value) ? value : 0
      }
      const fg = splitMade(at.has('fieldGoalsMade-fieldGoalAttempts') ? stats[at.get('fieldGoalsMade-fieldGoalAttempts')] : '')
      const xp = splitMade(at.has('extraPointsMade-extraPointAttempts') ? stats[at.get('extraPointsMade-extraPointAttempts')] : '')
      const meta = data.events?.[event.eventId] || {}
      const row = {
        date: String(meta.gameDate || event.eventId),
        venue: meta.atVs === '@' ? 'away' : meta.atVs === 'vs' ? 'home' : 'neutral',
        att: read('passingAttempts'),
        cmp: read('completions'),
        passYds: read('passingYards'),
        passTd: read('passingTouchdowns'),
        int: read('interceptions'),
        sacks: read('sacks'),
        car: read('rushingAttempts'),
        rushYds: read('rushingYards'),
        rushTd: read('rushingTouchdowns'),
        tgt: read('receivingTargets'),
        rec: read('receptions'),
        recYds: read('receivingYards'),
        recTd: read('receivingTouchdowns'),
        fgMade: fg?.made || 0,
        fgAtt: fg?.attempted || 0,
        xpMade: xp?.made || 0,
        xpAtt: xp?.attempted || 0,
      }
      const used = row.att + row.car + row.tgt + row.rec + row.fgAtt + row.xpAtt
      if (used > 0) games.push(row)
    }
  }
  return games
}

function nflProfile(games) {
  const rows = games || []
  const rate = (made, attempts) => {
    const attemptTotal = sumOf(rows, attempts)
    if (attemptTotal <= 0) return null
    return sumOf(rows, made) / attemptTotal
  }
  return {
    games: rows,
    cmpPct: rate('cmp', 'att'),
    intPct: rate('int', 'att'),
    passTdPct: rate('passTd', 'cmp'),
    rushTdPct: rate('rushTd', 'car'),
    recTdPct: rate('recTd', 'rec'),
    fgPct: rate('fgMade', 'fgAtt'),
    xpPct: rate('xpMade', 'xpAtt'),
    ydsPerCmp: rate('passYds', 'cmp'),
    ydsPerCar: rate('rushYds', 'car'),
    ydsPerRec: rate('recYds', 'rec'),
    tgtMean: rows.length ? sumOf(rows, 'tgt') / rows.length : 0,
  }
}

function playYards(games, countKey, yardsKey, random, fallback) {
  const pool = (games || []).filter((game) => (game[countKey] || 0) > 0)
  const game = pool.length ? pool[Math.floor(random() * pool.length)] : null
  if (!game) return Math.round(fallback || 0)
  return Math.round(game[yardsKey] / game[countKey])
}

function emptyNflBox(name) {
  return {
    name,
    att: 0,
    cmp: 0,
    passYds: 0,
    passTd: 0,
    int: 0,
    sacks: 0,
    car: 0,
    rushYds: 0,
    rushTd: 0,
    tgt: 0,
    rec: 0,
    recYds: 0,
    recTd: 0,
    fgMade: 0,
    fgAtt: 0,
    xpMade: 0,
    xpAtt: 0,
  }
}

/**
 * One NFL game. A player game may include att, cmp, passYds, passTd, int,
 * sacks, car, rushYds, rushTd, tgt, rec, recYds, recTd. Missing keys are zero.
 * The quarterback is the player with the most passing attempts in the log.
 * A completion's receiver is chosen by observed target share.
 */
export function simulateNflDraw(home, away, random) {
  const build = (players) => players.map((player) => {
    const profile = nflProfile(player.games)
    const sample = pickGame(profile.games, random) || {}
    return {
      ...profile,
      name: player.name,
      sample,
      box: emptyNflBox(player.name),
    }
  })
  const homePlayers = build(home)
  const awayPlayers = build(away)
  const plays = []
  for (const [offense, defenseName] of [[homePlayers, 'away'], [awayPlayers, 'home']]) {
    const passer = [...offense].sort((a, b) => sumOf(b.games, 'att') - sumOf(a.games, 'att'))[0]
    const attempts = passer && sumOf(passer.games, 'att') > 0 ? (passer.sample.att || 0) : 0
    if (passer && attempts > 0) {
      passer.box.sacks = passer.sample.sacks || 0
      for (let i = 0; i < attempts; i += 1) {
        passer.box.att += 1
        const receiver = pickWeighted(offense, 'tgtMean', random, passer) || pickWeighted(offense, 'tgtMean', random)
        if (receiver && receiver !== passer) receiver.box.tgt += 1
        if (passer.intPct != null && random() < passer.intPct) {
          passer.box.int += 1
          plays.push(`${passer.name} interception${receiver && receiver !== passer ? `, intended for ${receiver.name}` : ''}`)
          continue
        }
        const complete = passer.cmpPct != null && random() < passer.cmpPct
        if (!complete) {
          plays.push(`${passer.name} incomplete${receiver && receiver !== passer ? ` for ${receiver.name}` : ''}`)
          continue
        }
        passer.box.cmp += 1
        const yards = receiver && receiver !== passer
          ? playYards(receiver.games, 'rec', 'recYds', random, receiver.ydsPerRec)
          : playYards(passer.games, 'cmp', 'passYds', random, passer.ydsPerCmp)
        passer.box.passYds += yards
        let text = `${passer.name} complete`
        if (receiver && receiver !== passer) {
          receiver.box.rec += 1
          receiver.box.recYds += yards
          text += ` to ${receiver.name} for ${yards}`
          if (receiver.recTdPct != null && random() < receiver.recTdPct) {
            receiver.box.recTd += 1
            passer.box.passTd += 1
            text += ', touchdown'
          }
        } else {
          text += ` for ${yards}`
          if (passer.passTdPct != null && random() < passer.passTdPct) {
            passer.box.passTd += 1
            text += ', touchdown'
          }
        }
        plays.push(text)
      }
    }
    for (const player of offense) {
      const carries = player.sample.car || 0
      for (let i = 0; i < carries; i += 1) {
        player.box.car += 1
        const yards = playYards(player.games, 'car', 'rushYds', random, player.ydsPerCar)
        player.box.rushYds += yards
        let text = `${player.name} rush for ${yards}`
        if (player.rushTdPct != null && random() < player.rushTdPct) {
          player.box.rushTd += 1
          text += ', touchdown'
        }
        plays.push(text)
      }
    }
    const touchdowns = offense.reduce((total, player) => total + player.box.passTd + player.box.rushTd, 0)
    const kicker = offense.find((player) => sumOf(player.games, 'fgAtt') + sumOf(player.games, 'xpAtt') > 0)
    if (kicker) {
      const kicks = kicker.sample.fgAtt || 0
      for (let i = 0; i < kicks; i += 1) {
        kicker.box.fgAtt += 1
        const made = kicker.fgPct != null && random() < kicker.fgPct
        if (made) kicker.box.fgMade += 1
        plays.push(`${kicker.name} field goal ${made ? 'good' : 'miss'}`)
      }
      for (let i = 0; i < touchdowns; i += 1) {
        kicker.box.xpAtt += 1
        const made = kicker.xpPct != null && random() < kicker.xpPct
        if (made) kicker.box.xpMade += 1
        plays.push(`${kicker.name} extra point ${made ? 'good' : 'miss'}`)
      }
    }
    void defenseName
  }
  const scoreOf = (players) => players.reduce((total, player) => (
    total + player.box.passTd * 6 + player.box.rushTd * 6 + player.box.fgMade * 3 + player.box.xpMade
  ), 0)
  return {
    home: homePlayers.map((player) => player.box),
    away: awayPlayers.map((player) => player.box),
    homeScore: scoreOf(homePlayers),
    awayScore: scoreOf(awayPlayers),
    plays,
  }
}

function medianNfl(draws, side) {
  const names = draws[0]?.[side]?.map((player) => player.name) || []
  return names.map((name) => {
    const rows = draws.map((draw) => draw[side].find((player) => player.name === name))
    const line = { name }
    for (const key of ['att', 'cmp', 'passYds', 'passTd', 'int', 'sacks', 'car', 'rushYds', 'rushTd', 'tgt', 'rec', 'recYds', 'recTd', 'fgMade', 'fgAtt', 'xpMade', 'xpAtt']) {
      line[key] = medianOf(rows.map((row) => row[key]))
    }
    return line
  })
}

export function simulateNflBox({ home, away, draws = 2000, seed = 1 }) {
  const random = mulberry32(seed)
  const played = []
  for (let i = 0; i < draws; i += 1) played.push(simulateNflDraw(home, away, random))
  return {
    draws,
    seed,
    home: medianNfl(played, 'home'),
    away: medianNfl(played, 'away'),
    homeMedian: medianOf(played.map((draw) => draw.homeScore)),
    awayMedian: medianOf(played.map((draw) => draw.awayScore)),
    sample: played[0],
  }
}
