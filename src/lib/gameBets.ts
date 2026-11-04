import type { BookName } from './tickets'

export type GameBet = {
  id: string
  book: BookName
  href: string
  american: number
  selection: string
  game: string
  kickoff: string
  group: string
  eventId: string
  sportPath: string
  note: string
  defaultStatus: 'open'
  defaultStake: ''
}

const DK = 'DraftKings' as const
const FD = 'FanDuel' as const

export type BoostSlip = {
  id: string
  book: BookName
  href: string
  title: string
  legs: string
  note: string
  defaultStatus: 'open'
  defaultStake: ''
}

/**
 * Boost slips built only from numbers that clear.
 * The combined price is the book's number on the slip. It is not a product of the leg prices.
 */
export const BOOSTS: BoostSlip[] = [
  {
    id: 'fd-nba-50',
    book: FD,
    href: 'https://sportsbook.fanduel.com/addToBetslip?marketId[0]=739.195732700&selectionId[0]=7017824&marketId[1]=739.195736189&selectionId[1]=7017824&marketId[2]=739.195203761&selectionId[2]=237491',
    title: 'FanDuel 50% NBA',
    legs: 'Hawks at Wizards under 231.5, Bulls at Knicks under 234.5, Grizzlies −5.5',
    note: '3 legs. The boost needs +100 or longer and a $10 max. Apply it on the slip. Confirm under 231.5, under 234.5, and the spread. The under ids are shared, and the Grizzlies id is also the moneyline.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'fd-any-25',
    book: FD,
    href: 'https://sportsbook.fanduel.com/addToBetslip?marketId=739.194952424&selectionId=7017911',
    title: 'FanDuel 25% any bet',
    legs: 'Blackhawks at Panthers over 5.5 −140',
    note: 'One leg. −140 is longer than the −200 minimum. $25 max. Expires Nov 9. Confirm the over is 5.5. That over id is shared.',
    defaultStatus: 'open',
    defaultStake: '',
  },
]

/**
 * Clears from the Wednesday Nov 4 card. Prices at 12:55 PM ET.
 * Each row is one selection. A price is ranked only when both books post that same number.
 */
export const GAME_BETS: GameBet[] = [
  {
    id: 'fd-hawks-wizards-under',
    book: FD,
    href: 'https://sportsbook.fanduel.com/addToBetslip?marketId=739.195732700&selectionId=7017824',
    american: -115,
    selection: 'Under 231.5',
    game: 'Hawks at Wizards',
    kickoff: '7:00 PM ET',
    group: 'hawks-wizards',
    eventId: '401909923',
    sportPath: 'basketball/nba',
    note: 'Totals 218.1, 223.1, 222, 210. Closest room 8.4. DraftKings is 230.5, a worse under. No link on 230.5. Confirm the under is 231.5. That under id is shared.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'fd-bulls-knicks-under',
    book: FD,
    href: 'https://sportsbook.fanduel.com/addToBetslip?marketId=739.195736189&selectionId=7017824',
    american: -115,
    selection: 'Under 234.5',
    game: 'Bulls at Knicks',
    kickoff: '7:30 PM ET',
    group: 'bulls-knicks',
    eventId: '401909926',
    sportPath: 'basketball/nba',
    note: 'Same reads. Closest room on 234.5 is 5.7. Confirm the under is 234.5. That under id is shared.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'fd-grizzlies-spread',
    book: FD,
    href: 'https://sportsbook.fanduel.com/addToBetslip?marketId=739.195203761&selectionId=237491',
    american: -115,
    selection: 'Grizzlies −5.5',
    game: 'Pacers at Grizzlies',
    kickoff: '8:00 PM ET',
    group: 'pacers-grizzlies',
    eventId: '401909927',
    sportPath: 'basketball/nba',
    note: 'Margins 8.1, 8.4, 10, 13.8. Closest room 2.6. DraftKings is −6.5, a worse number. No link on −6.5. Confirm the spread. This selection id is also the moneyline.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'dk-grizzlies-ml',
    book: DK,
    href: 'https://sportsbook.draftkings.com/event/34936989?outcomes=0ML87027692_1',
    american: -222,
    selection: 'Grizzlies to win',
    game: 'Pacers at Grizzlies',
    kickoff: '8:00 PM ET',
    group: 'pacers-grizzlies',
    eventId: '401909927',
    sportPath: 'basketball/nba',
    note: 'Every read is a Grizzlies win. Closest margin 8.1. FanDuel is −225. Confirm the moneyline.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'dk-grizzlies-over',
    book: DK,
    href: 'https://sportsbook.draftkings.com/event/34936989?outcomes=0OU87027692O22850_1',
    american: -106,
    selection: 'Over 228.5',
    game: 'Pacers at Grizzlies',
    kickoff: '8:00 PM ET',
    group: 'pacers-grizzlies',
    eventId: '401909927',
    sportPath: 'basketball/nba',
    note: 'Totals 243.9, 230.3, 239, 234.5. Closest room 1.8. FanDuel is 229.5 and does not clear. Confirm the over is 228.5.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'dk-panthers-over',
    book: DK,
    href: 'https://sportsbook.draftkings.com/event/34951580?outcomes=0OU87064455O550_1',
    american: -135,
    selection: 'Over 5.5',
    game: 'Blackhawks at Panthers',
    kickoff: '7:30 PM ET',
    group: 'blackhawks-panthers',
    eventId: '401892645',
    sportPath: 'hockey/nhl',
    note: 'Totals 6.9, 6.1, 6, 7. Closest room 0.5. Same number. FanDuel is −140. Confirm the over is 5.5.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'dk-sharks-under',
    book: DK,
    href: 'https://sportsbook.draftkings.com/event/34951581?outcomes=0OU87064453U650_3',
    american: -125,
    selection: 'Under 6.5',
    game: 'Sharks at Kings',
    kickoff: '10:00 PM ET',
    group: 'sharks-kings',
    eventId: '401892646',
    sportPath: 'hockey/nhl',
    note: 'Totals 6.1, 6.1, 5.5, 5.5. Closest room 0.4. FanDuel is the same 6.5 at −132. Confirm the under is 6.5.',
    defaultStatus: 'open',
    defaultStake: '',
  },
]
