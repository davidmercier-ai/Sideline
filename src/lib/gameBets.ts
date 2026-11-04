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

/**
 * Clears from the Wednesday Nov 4 card. Prices at 12:55 PM ET.
 * Each row is one selection. A price is ranked only when both books post that same number.
 */
export const GAME_BETS: GameBet[] = [
  {
    id: 'dk-hawks-wizards-under',
    book: DK,
    href: 'https://sportsbook.draftkings.com/event/34936984?outcomes=0OU87027687U23150_3',
    american: -108,
    selection: 'Under 231.5',
    game: 'Hawks at Wizards',
    kickoff: '7:00 PM ET',
    group: 'hawks-wizards',
    eventId: '401909923',
    sportPath: 'basketball/nba',
    note: 'Totals 218.1, 223.1, 222, 210. Closest room 8.4. FanDuel is the same 231.5 at −110.',
    defaultStatus: 'open',
    defaultStake: '',
  },
  {
    id: 'dk-bulls-knicks-under',
    book: DK,
    href: 'https://sportsbook.draftkings.com/event/34936988?outcomes=0OU87027691U23350_3',
    american: -110,
    selection: 'Under 233.5',
    game: 'Bulls at Knicks',
    kickoff: '7:30 PM ET',
    group: 'bulls-knicks',
    eventId: '401909926',
    sportPath: 'basketball/nba',
    note: 'Totals 221.1, 226.5, 218.5, 228.8. Closest room 4.7.',
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
    note: 'Margins 8.1, 8.4, 10, 13.8. Closest room 2.6. DraftKings is the same −5.5 at −117. Confirm the spread. This selection id is also the moneyline.',
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
    id: 'fd-panthers-over',
    book: FD,
    href: 'https://sportsbook.fanduel.com/addToBetslip?marketId=739.194952424&selectionId=7017911',
    american: -140,
    selection: 'Over 5.5',
    game: 'Blackhawks at Panthers',
    kickoff: '7:30 PM ET',
    group: 'blackhawks-panthers',
    eventId: '401892645',
    sportPath: 'hockey/nhl',
    note: 'Totals 6.9, 6.1, 6, 7. Closest room 0.5. DraftKings is 6.5 and does not clear. Confirm the over is 5.5. That over id is shared.',
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
