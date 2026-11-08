/**
 * Print a DraftKings or FanDuel slip link. Copy the output. Do not retype it.
 *
 * DraftKings, one or more selection ids. The event name is the board name.
 *   node scripts/slip-link.mjs dk "TB Buccaneers @ CHI Bears" 34118027 0OU84695460U4750_3
 *
 * FanDuel, pairs of marketId selectionId. One pair is one leg.
 *   node scripts/slip-link.mjs fd 739.194082469 7017917
 *   node scripts/slip-link.mjs fd 739.194644207 41173071 739.194851132 49541845
 *
 *   node scripts/slip-link.mjs self-test
 */

export function draftKingsEventSlug(eventName) {
  const name = String(eventName || '').trim().toLowerCase()
  if (!name) return ''
  return name.replaceAll(/\s+@\s+/g, '-%40-').replaceAll(/\s+/g, '-')
}

export function draftKingsDesktop(eventName, eventId, selectionIds) {
  const ids = clean(selectionIds)
  const event = String(eventId || '').trim()
  if (!ids.length || !event) return ''
  const slug = draftKingsEventSlug(eventName)
  const outcomes = ids.map((id) => encodeURIComponent(id)).join(',')
  const path = slug ? `${slug}/${encodeURIComponent(event)}` : encodeURIComponent(event)
  return `https://sportsbook.draftkings.com/event/${path}?outcomes=${outcomes}`
}

export function draftKingsPhone(selectionIds) {
  return clean(selectionIds).map((id) => `dksb://sb/addbet/${encodeURIComponent(id)}`)
}

export function fanDuelMessage(pairs) {
  const legs = (pairs || [])
    .map((pair) => ({
      marketId: String(pair?.marketId || '').trim(),
      selectionId: String(pair?.selectionId || '').trim(),
    }))
    .filter((pair) => pair.marketId && pair.selectionId)
  if (legs.length === 0) return ''
  if (legs.length === 1) {
    const leg = legs[0]
    return `https://sportsbook.fanduel.com/addToBetslip?marketId=${encodeURIComponent(leg.marketId)}&selectionId=${encodeURIComponent(leg.selectionId)}`
  }
  const query = legs
    .map((leg, index) => `marketId%5B${index}%5D=${encodeURIComponent(leg.marketId)}&selectionId%5B${index}%5D=${encodeURIComponent(leg.selectionId)}`)
    .join('&')
  return `https://sportsbook.fanduel.com/addToBetslip?${query}`
}

function clean(values) {
  return (values || []).map((value) => String(value || '').trim()).filter(Boolean)
}

function pairsFrom(args) {
  const pairs = []
  for (let i = 0; i < args.length; i += 2) pairs.push({ marketId: args[i], selectionId: args[i + 1] })
  return pairs
}

function printDraftKings(eventName, eventId, selectionIds) {
  const desktop = draftKingsDesktop(eventName, eventId, selectionIds)
  const phone = draftKingsPhone(selectionIds)
  if (!desktop || phone.length !== clean(selectionIds).length) {
    console.error('Need the event name, the event id, and at least one selection id.')
    process.exitCode = 1
    return
  }
  console.log('desktop')
  console.log(desktop)
  console.log('phone')
  for (const line of phone) console.log(line)
}

function selfTest() {
  const dkId = '0QA382657149#2341145992_13L88808Q1-549717439Q20'
  const desktop = draftKingsDesktop('SJ Sharks @ LA Kings', '34118045', [dkId, '0QA2#3'])
  const expected = 'https://sportsbook.draftkings.com/event/sj-sharks-%40-la-kings/34118045?outcomes=0QA382657149%232341145992_13L88808Q1-549717439Q20,0QA2%233'
  if (desktop !== expected) throw new Error(`desktop\n${desktop}\n${expected}`)
  const phone = draftKingsPhone(['0OU87064453U650_3', dkId])
  if (phone[0] !== 'dksb://sb/addbet/0OU87064453U650_3') throw new Error(phone[0])
  if (phone[1] !== 'dksb://sb/addbet/0QA382657149%232341145992_13L88808Q1-549717439Q20') throw new Error(phone[1])
  const one = fanDuelMessage([{ marketId: '739.194351327', selectionId: '42200635' }])
  if (one !== 'https://sportsbook.fanduel.com/addToBetslip?marketId=739.194351327&selectionId=42200635') throw new Error(one)
  const two = fanDuelMessage([
    { marketId: '739.194644207', selectionId: '41173071' },
    { marketId: '739.194851132', selectionId: '49541845' },
  ])
  const expectedTwo = 'https://sportsbook.fanduel.com/addToBetslip?marketId%5B0%5D=739.194644207&selectionId%5B0%5D=41173071&marketId%5B1%5D=739.194851132&selectionId%5B1%5D=49541845'
  if (two !== expectedTwo) throw new Error(two)
  console.log('self-test ok')
}

function main() {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'self-test') {
    selfTest()
    return
  }
  if (command === 'dk') {
    printDraftKings(args[0], args[1], args.slice(2))
    return
  }
  if (command === 'fd') {
    const link = fanDuelMessage(pairsFrom(args))
    if (!link || args.length < 2 || args.length % 2 !== 0) {
      console.error('Need pairs of marketId selectionId.')
      process.exitCode = 1
      return
    }
    console.log(link)
    return
  }
  console.error('Use: slip-link.mjs dk "Event Name" eventId selectionId [selectionId...]')
  console.error('Use: slip-link.mjs fd marketId selectionId [marketId selectionId...]')
  process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) main()
