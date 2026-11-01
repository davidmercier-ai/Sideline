import type { BookName } from './tickets'

export type CardSlip = {
  id: string
  book: BookName
  href: string
  american: number | null
  legs: string
  note: string
  defaultStatus: 'open' | 'placed'
  defaultStake: string
}

export type NamedCard = {
  id: string
  title: string
  game: string
  kickoff: string
  slips: CardSlip[]
}

const DK = 'DraftKings' as const
const FD = 'FanDuel' as const

/**
 * Named cards on the Ohio shelf at 3:08 PM ET, Sunday Nov 1, 2026.
 * A DraftKings american price is that book's price for the whole card.
 * FanDuel has no combined price on these slips.
 */
export const NAMED_CARDS: NamedCard[] = [
  {
    id: 'felger',
    title: 'Felger and Mazz',
    game: 'Patriots at Dolphins',
    kickoff: '4:25 PM ET',
    slips: [
      {
        id: 'dk-felger',
        book: DK,
        href: 'https://sportsbook.draftkings.com/event/34118184?outcomes=0QA382779352%232336626408_13L88808Q1-39347883Q20,0QA382779352%232336626269_13L88808Q1354446541Q20,0HC84695617N700_3',
        american: 2100,
        legs: 'Eli Raridon anytime, Ollie Gordon II anytime, Patriots −7',
        note: 'DraftKings card +2100 at 3:08 PM ET. Same game.',
        defaultStatus: 'open',
        defaultStake: '',
      },
      {
        id: 'fd-felger',
        book: FD,
        href: 'https://sportsbook.fanduel.com/addToBetslip?marketId[0]=739.194368215&selectionId[0]=95394736&marketId[1]=739.194368215&selectionId[1]=62271373',
        american: null,
        legs: 'Eli Raridon anytime +310, Ollie Gordon II anytime +160',
        note: 'FanDuel posts Patriots −7.5. The DraftKings card is Patriots −7, so this slip has the two anytime legs.',
        defaultStatus: 'open',
        defaultStake: '',
      },
    ],
  },
  {
    id: 'gruden',
    title: "Gruden's Gut Check",
    game: 'Eagles at Commanders',
    kickoff: '8:20 PM ET',
    slips: [
      {
        id: 'dk-gruden',
        book: DK,
        href: 'https://sportsbook.draftkings.com/event/34118045?outcomes=0ML84695478_1,0QA383274110%232338710931_13L88808Q11625228795Q20,0QA383275072%232338714803_13L88808Q1628754404Q20,0QA383274922%232338714202_13L88808Q1628754404Q20,0QA383274693%232338730722_13L88808Q11047375050Q20',
        american: 600,
        legs: 'Commanders to win, Jayden Daniels 200+ passing yards, Antonio Williams 30+, Stefon Diggs 30+, Rachaad White over 13.5 receiving yards',
        note: 'DraftKings card +600 at 3:08 PM ET. Same game.',
        defaultStatus: 'open',
        defaultStake: '',
      },
      {
        id: 'fd-gruden',
        book: FD,
        href: 'https://sportsbook.fanduel.com/addToBetslip?marketId[0]=739.192674874&selectionId[0]=42568622&marketId[1]=739.194571009&selectionId[1]=48141787&marketId[2]=739.194572232&selectionId[2]=102913934&marketId[3]=739.194572210&selectionId[3]=73565848&marketId[4]=739.194572264&selectionId[4]=41161337',
        american: null,
        legs: 'Commanders −270, Daniels 200+ −112, Williams 30+ −188, Diggs 30+ −250, White over 13.5 −102',
        note: 'Same five numbers. Diggs 30+ is the 30-yard price. His main total is 42.5.',
        defaultStatus: 'open',
        defaultStake: '',
      },
    ],
  },
  {
    id: 'greenberg',
    title: 'Mike Greenberg',
    game: 'Bears at Seahawks',
    kickoff: 'Monday 8:15 PM ET',
    slips: [
      {
        id: 'dk-greenberg',
        book: DK,
        href: 'https://sportsbook.draftkings.com/event/34118031?outcomes=0ML84695464_3,0QA382703214%232336268474_13L88808Q1-2015862131Q20,0QA382702391%232336264588_13L88808Q11271577035Q20',
        american: 500,
        legs: 'Bears to win, Caleb Williams 2+ passing touchdowns, Jaxon Smith-Njigba 80+ receiving yards',
        note: 'DraftKings card +500 at 3:08 PM ET. Same game.',
        defaultStatus: 'open',
        defaultStake: '',
      },
      {
        id: 'fd-greenberg',
        book: FD,
        href: 'https://sportsbook.fanduel.com/addToBetslip?marketId[0]=739.192674835&selectionId[0]=50194&marketId[1]=739.194619364&selectionId[1]=59734531&marketId[2]=739.194619335&selectionId[2]=48103126',
        american: null,
        legs: 'Bears +146, Caleb 2+ passing touchdowns +136, Smith-Njigba 80+ −245',
        note: 'Smith-Njigba 80+ is the 80-yard price. His main total is 99.5.',
        defaultStatus: 'open',
        defaultStake: '',
      },
    ],
  },
  {
    id: 'pmt',
    title: 'Pardon My Take',
    game: 'Dolphins and Commanders',
    kickoff: '4:25 PM ET and 8:20 PM ET',
    slips: [
      {
        id: 'dk-pmt',
        book: DK,
        href: 'https://sportsbook.draftkings.com/?outcomes=0QA382779352%232336626402_13L88808Q1-1828996474Q20,0QA382779352%232336626269_13L88808Q1354446541Q20,0QA383276048%232338717609_13L88808Q1622596392Q20',
        american: 1248,
        legs: 'Rhamondre Stevenson anytime, Ollie Gordon II anytime, Stefon Diggs anytime',
        note: 'DraftKings card +1248 at 3:08 PM ET. Open in Safari. The slip crosses two games.',
        defaultStatus: 'open',
        defaultStake: '',
      },
      {
        id: 'fd-pmt',
        book: FD,
        href: 'https://sportsbook.fanduel.com/addToBetslip?marketId[0]=739.194368215&selectionId[0]=26919640&marketId[1]=739.194368215&selectionId[1]=62271373&marketId[2]=739.194571002&selectionId[2]=10288139',
        american: null,
        legs: 'Stevenson anytime −125, Gordon anytime +160, Diggs anytime +195',
        note: 'Check all three names on the slip. The phone has not confirmed this multi-leg FanDuel link.',
        defaultStatus: 'open',
        defaultStake: '',
      },
    ],
  },
]
