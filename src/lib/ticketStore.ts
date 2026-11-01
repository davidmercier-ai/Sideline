import type { TicketStatus } from './ledger'

export type SavedTicket = {
  status: TicketStatus
  stake: string
}

export type TicketSeed = {
  id: string
  defaultStatus: 'open' | 'placed'
  defaultStake: string
}

const KEY = 'sideline.board.v1'

export function readTicketStore(): Record<string, SavedTicket> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, SavedTicket>
  } catch {
    return {}
  }
}

export function writeTicketStore(value: Record<string, SavedTicket>): void {
  localStorage.setItem(KEY, JSON.stringify(value))
}

export function ticketView(ticket: TicketSeed, saved: Record<string, SavedTicket>): SavedTicket {
  return saved[ticket.id] ?? { status: ticket.defaultStatus, stake: ticket.defaultStake }
}
