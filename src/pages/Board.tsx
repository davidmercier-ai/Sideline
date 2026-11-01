import { useMemo, useState } from 'react'
import { progressLine } from '../lib/boxScore'
import { ledger, parseStake, type TicketStatus } from '../lib/ledger'
import { loadGameSnaps, loadStats } from '../lib/nflBoard'
import { ticketView, readTicketStore, writeTicketStore, type SavedTicket } from '../lib/ticketStore'
import { BOOK_COLOR, TICKETS, type Ticket } from '../lib/tickets'
import { usePoll } from '../lib/usePoll'

const STATUSES: { id: TicketStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'placed', label: 'Placed' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'push', label: 'Push' },
]

function american(price: number): string {
  return price > 0 ? `+${price}` : `−${Math.abs(price)}`
}

function dollars(value: number): string {
  const sign = value < 0 ? '−' : ''
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

function statKey(ticket: Ticket): string {
  return `${ticket.eventId}:${ticket.player}:${ticket.statKey}`
}

export function BoardPage() {
  const [saved, setSaved] = useState<Record<string, SavedTicket>>(readTicketStore)
  const progress = usePoll(
    async () => {
      const eventIds = [...new Set(TICKETS.map((ticket) => ticket.eventId))]
      const snaps = await loadGameSnaps(eventIds)
      const stats = await loadStats(
        snaps,
        TICKETS.map((ticket) => ({
          eventId: ticket.eventId,
          player: ticket.player,
          statKey: ticket.statKey,
        })),
      )
      return { snaps, stats }
    },
    'sunday-board',
    30000,
  )

  function update(id: string, patch: Partial<SavedTicket>) {
    setSaved((prev) => {
      const ticket = TICKETS.find((row) => row.id === id)
      if (!ticket) return prev
      const next = {
        ...prev,
        [id]: { ...ticketView(ticket, prev), ...patch },
      }
      writeTicketStore(next)
      return next
    })
  }

  const book = useMemo(
    () =>
      ledger(
        TICKETS.map((ticket) => {
          const view = ticketView(ticket, saved)
          return { status: view.status, stake: parseStake(view.stake), american: ticket.american }
        }),
      ),
    [saved],
  )

  const groups = TICKETS.filter((ticket, index) => TICKETS.findIndex((row) => row.group === ticket.group) === index)
  const live = groups.filter((ticket) => progress.data?.snaps[ticket.eventId]?.state !== 'pre')
  const later = groups.filter((ticket) => progress.data?.snaps[ticket.eventId]?.state === 'pre' || !progress.data)

  return (
    <main>
      <section className="page-hero">
        <div>
          <h1>Board</h1>
          <p className="lede">
            Sunday alerts and ticket progress. A link opens in the book, outside this page. Mark Placed when the ticket is in. The mark stays in this browser.
          </p>
        </div>
      </section>

      <section className="board-metrics" aria-label="Exposure">
        <article className="card board-metric">
          <span className="meta">At risk</span>
          <b>{dollars(book.atRisk)}</b>
          <span>Stakes still on placed tickets.</span>
        </article>
        <article className="card board-metric">
          <span className="meta">Potential gain</span>
          <b>{dollars(book.potentialGain)}</b>
          <span>Each placed ticket’s own to-win. Not a parlay price.</span>
        </article>
        <article className="card board-metric">
          <span className="meta">Settled</span>
          <b>{dollars(book.settled)}</b>
          <span>Wins added, losses subtracted.</span>
        </article>
      </section>

      {progress.error ? <p className="lede">Game progress is unavailable. Ticket marks are still saved.</p> : null}

      <BoardList
        title={progress.data ? 'In progress' : 'Alerts'}
        groups={progress.data ? live : groups}
        saved={saved}
        snaps={progress.data?.snaps}
        stats={progress.data?.stats}
        onUpdate={update}
      />
      {progress.data && later.length > 0 ? (
        <BoardList title="Later" groups={later} saved={saved} snaps={progress.data.snaps} stats={progress.data.stats} onUpdate={update} />
      ) : null}
    </main>
  )
}

function BoardList({
  title,
  groups,
  saved,
  snaps,
  stats,
  onUpdate,
}: {
  title: string
  groups: Ticket[]
  saved: Record<string, SavedTicket>
  snaps?: Record<string, { detail: string; matchup: string; score: string; state: string }>
  stats?: Record<string, number | null>
  onUpdate: (id: string, patch: Partial<SavedTicket>) => void
}) {
  if (groups.length === 0) return null
  return (
    <section className="board-section">
      <h2 className="section-title">{title}</h2>
      {groups.map((lead) => {
        const legs = TICKETS.filter((ticket) => ticket.group === lead.group)
        const snap = snaps?.[lead.eventId]
        const stat = stats?.[statKey(lead)] ?? null
        return (
          <article key={lead.group} className="card board-row">
            <header className="board-head">
              <div>
                <h3>{lead.player}</h3>
                <p>
                  {lead.market}
                  {' · '}
                  {snap?.matchup ?? lead.game}
                  {snap?.score ? ` · ${snap.score}` : ''}
                  {snap?.detail ? ` · ${snap.detail}` : ` · ${lead.kickoff}`}
                </p>
              </div>
            </header>
            <ul className="board-legs">
              {legs.map((ticket) => {
                const view = ticketView(ticket, saved)
                return (
                  <li key={ticket.id}>
                    <a className="book-link" href={ticket.href} target="_blank" rel="noopener noreferrer" style={{ color: BOOK_COLOR[ticket.book] }}>
                      {ticket.book} {ticket.side === 'anytime' ? 'anytime' : `${ticket.side} ${ticket.line}`} {american(ticket.american)}
                    </a>
                    <p className="board-progress">{progressLine(ticket.side, ticket.line, stat, ticket.book)}</p>
                    <div className="board-controls">
                      <div className="filters" role="group" aria-label={`${ticket.book} status`}>
                        {STATUSES.map((status) => (
                          <button
                            key={status.id}
                            type="button"
                            className={view.status === status.id ? 'chip active' : 'chip'}
                            onClick={() => onUpdate(ticket.id, { status: status.id })}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                      <label className="stake-label">
                        Stake
                        <input
                          className="stake-field"
                          inputMode="decimal"
                          value={view.stake}
                          placeholder="0"
                          aria-label={`${ticket.book} stake`}
                          onChange={(event) => onUpdate(ticket.id, { stake: event.target.value })}
                        />
                      </label>
                    </div>
                    <p className="board-note">{ticket.note}</p>
                  </li>
                )
              })}
            </ul>
          </article>
        )
      })}
    </section>
  )
}
