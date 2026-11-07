/**
 * Published skill ratings.
 * Madden NFL 27, EA NHL, and EA FC come from the EA ratings pages.
 * NBA 2K27 comes from the public 2K ratings API, which reads 2kratings.
 * MLB The Show 26 Live cards come from mlb26.theshow.com.
 * A player the source does not list stays missing. No rating is invented.
 */

const HEADERS = { Accept: 'application/json, text/html', 'User-Agent': 'Mozilla/5.0 SidelineProjection/0.1' }

export function ratingName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function getText(url) {
  let last
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: HEADERS })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return response.text()
    } catch (error) {
      last = error
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }
  throw last
}

async function getJson(url) {
  return JSON.parse(await getText(url))
}

function nextData(html) {
  const raw = html.split('__NEXT_DATA__" type="application/json">')[1]?.split('</script>')[0]
  if (!raw) throw new Error('ratings page had no data')
  return JSON.parse(raw)
}

function slimStats(stats) {
  const out = {}
  for (const [key, value] of Object.entries(stats || {})) {
    const number = typeof value === 'number' ? value : Number(value?.value)
    if (Number.isFinite(number)) out[key] = number
  }
  return out
}

function slimEa(item, source) {
  return {
    name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
    team: item.team?.label || null,
    position: item.position?.shortLabel || item.position?.label || null,
    overall: item.overallRating ?? item.stats?.overall?.value ?? null,
    iteration: item.iteration?.label || item.iteration?.id || null,
    source,
    stats: slimStats(item.stats),
  }
}

export function indexRatings(players) {
  const map = new Map()
  for (const player of players) {
    const key = ratingName(player.name)
    if (!key) continue
    const prev = map.get(key)
    if (!prev || (player.overall || 0) > (prev.overall || 0)) map.set(key, player)
  }
  return map
}

async function pool(count, limit, worker) {
  const results = new Array(count)
  let index = 0
  async function run() {
    while (index < count) {
      const current = index
      index += 1
      results[current] = await worker(current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, count) }, () => run()))
  return results
}

export async function loadEaRatings(franchise) {
  const html = await getText(`https://www.ea.com/games/${franchise}/ratings`)
  const first = nextData(html)
  const build = first.buildId
  const details = first.props.pageProps.ratingDetails
  const pageSize = details.items.length || 1
  const pages = Math.ceil(details.totalItems / pageSize)
  const rest = await pool(Math.max(0, pages - 1), 6, async (offset) => {
    const data = await getJson(`https://www.ea.com/_next/data/${build}/games/${franchise}/ratings.json?page=${offset + 2}`)
    return data.pageProps?.ratingDetails?.items || []
  })
  const items = details.items.concat(...rest)
  const source = `${franchise} ${items[0]?.iteration?.label || ''}`.trim()
  return {
    source,
    total: details.totalItems,
    players: items.map((item) => slimEa(item, source)),
  }
}

export async function searchFc(name) {
  const html = await getText('https://www.ea.com/games/ea-sports-fc/ratings')
  const build = nextData(html).buildId
  const data = await getJson(`https://www.ea.com/_next/data/${build}/games/ea-sports-fc/ratings.json?search=${encodeURIComponent(name)}`)
  const items = data.pageProps?.ratingDetails?.items || []
  const exact = items.find((item) => ratingName(`${item.firstName} ${item.lastName}`) === ratingName(name))
  const item = exact || items[0]
  if (!item) return null
  return slimEa(item, `EA FC ${item.iteration?.label || ''}`.trim())
}

export async function loadNba2k() {
  const players = []
  let cursor = ''
  let guard = 0
  while (guard < 20) {
    guard += 1
    const url = `https://api.nba2kapi.com/api/public/players?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
    const body = await getJson(url)
    if (!body.success) throw new Error(body.error?.message || '2K ratings failed')
    for (const row of body.data || []) {
      players.push({
        name: row.name,
        team: row.team,
        position: (row.positions || []).join('/'),
        overall: row.overall,
        updated: row.lastUpdated || null,
        source: 'NBA 2K27 via api.nba2kapi.com',
        stats: slimStats(row.attributes),
      })
    }
    if (!body.meta?.pagination?.hasMore) break
    cursor = body.meta.pagination.nextCursor
    if (!cursor) break
  }
  return { source: 'NBA 2K27 via api.nba2kapi.com', total: players.length, players }
}

const SHOW_RARITIES = ['Common', 'Bronze', 'Silver', 'Gold', 'Diamond']

function liveCard(item) {
  if (!item || item.series !== 'Live') return null
  return {
    name: item.name,
    team: item.team,
    position: item.display_position,
    overall: item.ovr,
    uuid: item.uuid,
    source: 'MLB The Show 26 Live',
  }
}

export async function loadShowLiveIndex() {
  const cards = []
  for (const rarity of SHOW_RARITIES) {
    const first = await getJson(`https://mlb26.theshow.com/apis/listings.json?page=1&type=mlb_card&rarity=${encodeURIComponent(rarity)}`)
    for (const listing of first.listings || []) {
      const card = liveCard(listing.item)
      if (card) cards.push(card)
    }
    const pages = Math.min(first.total_pages || 1, 40)
    const rest = await pool(Math.max(0, pages - 1), 6, async (offset) => {
      const body = await getJson(`https://mlb26.theshow.com/apis/listings.json?page=${offset + 2}&type=mlb_card&rarity=${encodeURIComponent(rarity)}`)
      return (body.listings || []).map((listing) => liveCard(listing.item)).filter(Boolean)
    })
    cards.push(...rest.flat())
  }
  return { source: 'MLB The Show 26 Live', total: cards.length, players: cards }
}

export async function loadShowCard(uuid) {
  const item = await getJson(`https://mlb26.theshow.com/apis/item.json?uuid=${uuid}`)
  return {
    name: item.name,
    team: item.team,
    position: item.display_position,
    overall: item.ovr,
    source: 'MLB The Show 26 Live',
    stats: slimStats(item),
  }
}

export function meanSkill(values) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (!nums.length) return null
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}
