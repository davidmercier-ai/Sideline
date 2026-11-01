export type TicketStatus = 'open' | 'placed' | 'won' | 'lost' | 'push'

export type LedgerRow = {
  status: TicketStatus
  stake: number
  american: number
}

export type Ledger = {
  atRisk: number
  potentialGain: number
  settled: number
}

/** Profit on one ticket at an American price. This is not a parlay price. */
export function singleProfit(stake: number, american: number): number {
  if (!Number.isFinite(stake) || stake <= 0) return 0
  if (!Number.isFinite(american) || american === 0) return 0
  if (american > 0) return (stake * american) / 100
  return (stake * 100) / Math.abs(american)
}

export function money(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * At risk is the stake still on a placed ticket.
 * Potential gain is that ticket's own to-win.
 * Settled adds a win and subtracts a loss. A push changes nothing.
 */
export function ledger(rows: LedgerRow[]): Ledger {
  let atRisk = 0
  let potentialGain = 0
  let settled = 0
  for (const row of rows) {
    const profit = singleProfit(row.stake, row.american)
    if (row.status === 'placed') {
      atRisk += row.stake
      potentialGain += profit
    } else if (row.status === 'won') {
      settled += profit
    } else if (row.status === 'lost') {
      settled -= row.stake
    }
  }
  return {
    atRisk: money(atRisk),
    potentialGain: money(potentialGain),
    settled: money(settled),
  }
}

export function parseStake(raw: string): number {
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}
