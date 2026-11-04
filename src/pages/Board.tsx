import { useState, type FormEvent } from 'react'
import { messageLink, sendBetLink, shareMessage } from '../lib/shareLink'
import { NAMED_CARDS, type NamedCard } from '../lib/cards'
import { progressLine } from '../lib/boxScore'
import { BOOSTS, GAME_BETS, type BoostSlip, type GameBet } from '../lib/gameBets'
import { ledger, parseStake, type TicketStatus } from '../lib/ledger'
import { loadGameSnaps, loadSportSnaps, loadStats } from '../lib/nflBoard'
import {
  allowsBook,
  BUILTIN_PRESETS,
  FEATURE_LABELS,
  matchingPreset,
  presetNameError,
  readPresetStore,
  removeCustomPreset,
  toggleFeature,
  upsertCustomPreset,
  writePresetStore,
  type FeatureId,
  type Features,
  type Preset,
} from '../lib/presets'
import { readTicketStore, ticketView, writeTicketStore, type SavedTicket, type TicketSeed } from '../lib/ticketStore'
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

function seeds(): TicketSeed[] {
  return [...BOOSTS, ...GAME_BETS, ...TICKETS, ...NAMED_CARDS.flatMap((card) => card.slips)]
}

export function BoardPage() {
  const [store] = useState(readPresetStore)
  const [features, setFeatures] = useState<Features>(store.features)
  const [custom, setCustom] = useState<Preset[]>(store.custom)
  const [presetName, setPresetName] = useState('')
  const [presetMessage, setPresetMessage] = useState('')
  const [saved, setSaved] = useState<Record<string, SavedTicket>>(readTicketStore)
  const progress = usePoll(
    async () => {
      const eventIds = [...new Set(TICKETS.map((ticket) => ticket.eventId))]
      const [snaps, betSnaps] = await Promise.all([
        loadGameSnaps(eventIds),
        loadSportSnaps(
          GAME_BETS.map((bet) => ({ eventId: bet.eventId, sportPath: bet.sportPath })),
          '20261104',
        ),
      ])
      const stats = await loadStats(
        snaps,
        TICKETS.map((ticket) => ({
          eventId: ticket.eventId,
          player: ticket.player,
          statKey: ticket.statKey,
        })),
      )
      return { snaps: { ...snaps, ...betSnaps }, stats }
    },
    'sunday-board',
    30000,
  )

  function remember(nextFeatures: Features, nextCustom: Preset[] = custom) {
    setFeatures(nextFeatures)
    setCustom(nextCustom)
    writePresetStore(nextFeatures, nextCustom)
  }

  function update(id: string, patch: Partial<SavedTicket>) {
    setSaved((prev) => {
      const ticket = seeds().find((row) => row.id === id)
      if (!ticket) return prev
      const next = {
        ...prev,
        [id]: { ...ticketView(ticket, prev), ...patch },
      }
      writeTicketStore(next)
      return next
    })
  }

  const active = matchingPreset(features, custom)
  const gameBets = GAME_BETS.filter((bet) => features.bets && allowsBook(features, bet.book))
  const boosts = BOOSTS.filter((slip) => features.bets && allowsBook(features, slip.book))
  const propTickets = TICKETS.filter((ticket) => features.props && allowsBook(features, ticket.book))
  const cards = NAMED_CARDS.map((card) => ({
    ...card,
    slips: card.slips.filter((slip) => features.cards && allowsBook(features, slip.book)),
  })).filter((card) => card.slips.length > 0)

  const book = ledger([
    ...boosts.map((slip) => {
      const view = ticketView(slip, saved)
      return { status: view.status, stake: parseStake(view.stake), american: 0 }
    }),
    ...gameBets.map((bet) => {
      const view = ticketView(bet, saved)
      return { status: view.status, stake: parseStake(view.stake), american: bet.american }
    }),
    ...propTickets.map((ticket) => {
      const view = ticketView(ticket, saved)
      return { status: view.status, stake: parseStake(view.stake), american: ticket.american }
    }),
    ...cards.flatMap((card) =>
      card.slips.map((slip) => {
        const view = ticketView(slip, saved)
        return { status: view.status, stake: parseStake(view.stake), american: slip.american ?? 0 }
      }),
    ),
  ])

  const groups = propTickets.filter((ticket, index) => propTickets.findIndex((row) => row.group === ticket.group) === index)
  const live = groups.filter((ticket) => progress.data?.snaps[ticket.eventId]?.state !== 'pre')
  const later = groups.filter((ticket) => progress.data?.snaps[ticket.eventId]?.state === 'pre' || !progress.data)
  const propGroups = progress.data ? live : groups
  const betGroups = gameBets.filter((bet, index) => gameBets.findIndex((row) => row.group === bet.group) === index)
  const nothingOn = betGroups.length === 0 && propGroups.length === 0 && !(features.later && later.length > 0) && cards.length === 0

  function onToggle(id: FeatureId) {
    setPresetMessage('')
    remember(toggleFeature(features, id))
  }

  function onPreset(preset: Preset) {
    setPresetMessage('')
    remember(preset.features)
  }

  function onSave(event: FormEvent) {
    event.preventDefault()
    const error = presetNameError(presetName)
    if (error === 'empty') {
      setPresetMessage('Type a name for this preset.')
      return
    }
    if (error === 'builtin') {
      setPresetMessage(`${presetName.trim()} is already a preset. Pick another name.`)
      return
    }
    remember(features, upsertCustomPreset(custom, presetName, features))
    setPresetName('')
    setPresetMessage(`Saved ${presetName.trim()}.`)
  }

  function onRemove(preset: Preset) {
    remember(features, removeCustomPreset(custom, preset.id))
    setPresetMessage(`Removed ${preset.name}.`)
  }

  return (
    <main>
      <section className="page-hero">
        <div>
          <h1>Board</h1>
          <p className="lede">
            Turn books, props, named cards, live progress, and exposure on or off. A preset stores that combination in this browser.
          </p>
        </div>
      </section>

      <section className="card preset-panel" aria-label="Presets and features">
        <div>
          <h2 className="preset-label">Presets</h2>
          <div className="filters" role="group" aria-label="Presets">
            {[...BUILTIN_PRESETS, ...custom].map((preset) => (
              <span key={preset.id} className="preset-pair">
                <button type="button" className={active?.id === preset.id ? 'chip active' : 'chip'} aria-pressed={active?.id === preset.id} onClick={() => onPreset(preset)}>
                  {preset.name}
                </button>
                {preset.builtin || active?.id !== preset.id ? null : (
                  <button type="button" className="text-action" onClick={() => onRemove(preset)} aria-label={`Remove ${preset.name}`}>
                    Remove
                  </button>
                )}
              </span>
            ))}
          </div>
          <form className="preset-save" onSubmit={onSave}>
            <label>
              Preset name
              <input className="stake-field preset-name" value={presetName} maxLength={32} onChange={(event) => setPresetName(event.target.value)} />
            </label>
            <button type="submit" className="chip">
              Save preset
            </button>
          </form>
          {presetMessage ? <p className="board-note">{presetMessage}</p> : null}
        </div>
        <div>
          <h2 className="preset-label">Features</h2>
          <div className="filters" role="group" aria-label="Features">
            {FEATURE_LABELS.map((feature) => (
              <button key={feature.id} type="button" className={features[feature.id] ? 'chip active' : 'chip'} aria-pressed={features[feature.id]} onClick={() => onToggle(feature.id)}>
                {feature.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {features.exposure ? (
        <section className="board-metrics" aria-label="Exposure">
          <article className="card board-metric">
            <span className="meta">At risk</span>
            <b>{dollars(book.atRisk)}</b>
            <span>Stakes still on placed tickets in this preset.</span>
          </article>
          <article className="card board-metric">
            <span className="meta">Potential gain</span>
            <b>{dollars(book.potentialGain)}</b>
            <span>Each placed ticket’s own to-win. A card with no book price adds none.</span>
          </article>
          <article className="card board-metric">
            <span className="meta">Settled</span>
            <b>{dollars(book.settled)}</b>
            <span>Wins added, losses subtracted.</span>
          </article>
        </section>
      ) : null}

      {progress.error ? <p className="lede">Game progress is unavailable. Ticket marks are still saved.</p> : null}
      {nothingOn ? <p className="empty">Nothing is on for this combination.</p> : null}

      <BoostList boosts={boosts} saved={saved} onUpdate={update} />
      <BetList
        bets={gameBets}
        groups={betGroups}
        saved={saved}
        snaps={progress.data?.snaps}
        showProgress={features.progress}
        onUpdate={update}
      />

      <BoardList
        title={progress.data ? 'In progress' : 'Props'}
        pool={propTickets}
        groups={propGroups}
        saved={saved}
        snaps={progress.data?.snaps}
        stats={progress.data?.stats}
        showProgress={features.progress}
        onUpdate={update}
      />
      {progress.data && features.later && later.length > 0 ? (
        <BoardList title="Later" pool={propTickets} groups={later} saved={saved} snaps={progress.data.snaps} stats={progress.data.stats} showProgress={features.progress} onUpdate={update} />
      ) : null}
      {cards.length > 0 ? <CardList cards={cards} saved={saved} onUpdate={update} /> : null}
    </main>
  )
}

function BoostList({
  boosts,
  saved,
  onUpdate,
}: {
  boosts: BoostSlip[]
  saved: Record<string, SavedTicket>
  onUpdate: (id: string, patch: Partial<SavedTicket>) => void
}) {
  if (boosts.length === 0) return null
  return (
    <section className="board-section">
      <h2 className="section-title">Boosts</h2>
      <p className="board-note">The slip price is the book’s number. Apply the boost on the slip. Opening a link does not place the bet.</p>
      {boosts.map((slip) => (
        <article key={slip.id} className="card board-row">
          <header className="board-head">
            <div>
              <h3>{slip.title}</h3>
              <p>{slip.legs}</p>
            </div>
          </header>
          <ul className="board-legs">
            <SlipControls
              seed={slip}
              label={slip.book}
              detail={slip.legs}
              href={slip.href}
              color={BOOK_COLOR[slip.book]}
              note={slip.note}
              progress=""
              confirm="Confirm the team and the number on the slip."
              saved={saved}
              onUpdate={onUpdate}
            />
          </ul>
        </article>
      ))}
    </section>
  )
}

function BetList({
  bets,
  groups,
  saved,
  snaps,
  showProgress,
  onUpdate,
}: {
  bets: GameBet[]
  groups: GameBet[]
  saved: Record<string, SavedTicket>
  snaps?: Record<string, { detail: string; matchup: string; score: string; state: string }>
  showProgress: boolean
  onUpdate: (id: string, patch: Partial<SavedTicket>) => void
}) {
  if (groups.length === 0) return null
  return (
    <section className="board-section">
      <h2 className="section-title">Bets</h2>
      <p className="board-note">Prices at 1:27 PM ET. Opening a link does not place the bet.</p>
      {groups.map((lead) => {
        const legs = bets.filter((bet) => bet.group === lead.group)
        const snap = snaps?.[lead.eventId]
        const clock = showProgress && snap?.detail ? snap.detail : lead.kickoff
        return (
          <article key={lead.group} className="card board-row">
            <header className="board-head">
              <div>
                <h3>{showProgress && snap?.matchup ? snap.matchup : lead.game}</h3>
                <p>
                  {clock}
                  {showProgress && snap?.score ? ` · ${snap.score}` : ''}
                </p>
              </div>
            </header>
            <ul className="board-legs">
              {legs.map((bet) => (
                <SlipControls
                  key={bet.id}
                  seed={bet}
                  label={`${bet.book} ${bet.selection} ${american(bet.american)}`}
                  detail={`${bet.game}, ${bet.kickoff}`}
                  href={bet.href}
                  color={BOOK_COLOR[bet.book]}
                  note={bet.note}
                  progress=""
                  confirm="Confirm the team and the number on the slip."
                  saved={saved}
                  onUpdate={onUpdate}
                />
              ))}
            </ul>
          </article>
        )
      })}
    </section>
  )
}

function BoardList({
  title,
  pool,
  groups,
  saved,
  snaps,
  stats,
  showProgress,
  onUpdate,
}: {
  title: string
  pool: Ticket[]
  groups: Ticket[]
  saved: Record<string, SavedTicket>
  snaps?: Record<string, { detail: string; matchup: string; score: string; state: string }>
  stats?: Record<string, number | null>
  showProgress: boolean
  onUpdate: (id: string, patch: Partial<SavedTicket>) => void
}) {
  if (groups.length === 0) return null
  return (
    <section className="board-section">
      <h2 className="section-title">{title}</h2>
      {groups.map((lead) => {
        const legs = pool.filter((ticket) => ticket.group === lead.group)
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
                  {showProgress ? (snap?.matchup ?? lead.game) : lead.game}
                  {showProgress && snap?.score ? ` · ${snap.score}` : ''}
                  {showProgress && snap?.detail ? ` · ${snap.detail}` : ` · ${lead.kickoff}`}
                </p>
              </div>
            </header>
            <ul className="board-legs">
              {legs.map((ticket) => (
                <SlipControls
                  key={ticket.id}
                  seed={ticket}
                  label={`${ticket.book} ${ticket.side === 'anytime' ? 'anytime' : `${ticket.side} ${ticket.line}`} ${american(ticket.american)}`}
                  detail={`${ticket.game}, ${ticket.kickoff}`}
                  href={ticket.href}
                  color={BOOK_COLOR[ticket.book]}
                  note={ticket.note}
                  progress={showProgress ? progressLine(ticket.side, ticket.line, stat, ticket.book) : ''}
                  confirm="Confirm the player and the number on the slip."
                  saved={saved}
                  onUpdate={onUpdate}
                />
              ))}
            </ul>
          </article>
        )
      })}
    </section>
  )
}

function CardList({
  cards,
  saved,
  onUpdate,
}: {
  cards: NamedCard[]
  saved: Record<string, SavedTicket>
  onUpdate: (id: string, patch: Partial<SavedTicket>) => void
}) {
  return (
    <section className="board-section">
      <h2 className="section-title">Named cards</h2>
      {cards.map((card) => (
        <article key={card.id} className="card board-row">
          <header className="board-head">
            <div>
              <h3>{card.title}</h3>
              <p>
                {card.game}
                {' · '}
                {card.kickoff}
              </p>
            </div>
          </header>
          <ul className="board-legs">
            {card.slips.map((slip) => (
              <SlipControls
                key={slip.id}
                seed={slip}
                label={slip.american == null ? slip.book : `${slip.book} ${american(slip.american)}`}
                detail={`${card.title}. ${card.game}, ${card.kickoff}. ${slip.legs}`}
                href={slip.href}
                color={BOOK_COLOR[slip.book]}
                note={`${slip.legs} ${slip.note}`}
                progress=""
                confirm="Confirm the player and the number on the slip."
                saved={saved}
                onUpdate={onUpdate}
              />
            ))}
          </ul>
        </article>
      ))}
    </section>
  )
}

function SlipControls({
  seed,
  label,
  detail,
  href,
  color,
  note,
  progress,
  confirm,
  saved,
  onUpdate,
}: {
  seed: TicketSeed
  label: string
  detail: string
  href: string
  color: string
  note: string
  progress: string
  confirm: string
  saved: Record<string, SavedTicket>
  onUpdate: (id: string, patch: Partial<SavedTicket>) => void
}) {
  const view = ticketView(seed, saved)
  const [sendNote, setSendNote] = useState('')
  const link = messageLink(href)

  async function onSend() {
    const message = shareMessage(label, detail, href, confirm)
    const outcome = await sendBetLink(message)
    if (outcome === 'copied') setSendNote('Copied. Paste it into a message.')
    else if (outcome === 'shared') setSendNote('Ready to send.')
    else if (outcome === 'failed') setSendNote('The link could not be copied.')
    else setSendNote('')
  }

  return (
    <li>
      <div className="book-line">
        <a className="book-link" href={link} target="_blank" rel="noopener noreferrer" style={{ color }}>
          {label}
        </a>
        <button type="button" className="chip" onClick={onSend} aria-label={`Send ${label}`}>
          Send
        </button>
      </div>
      {sendNote ? (
        <p className="board-note" role="status">
          {sendNote}
        </p>
      ) : null}
      {progress ? <p className="board-progress">{progress}</p> : null}
      <div className="board-controls">
        <div className="filters" role="group" aria-label={`${label} status`}>
          {STATUSES.map((status) => (
            <button key={status.id} type="button" className={view.status === status.id ? 'chip active' : 'chip'} onClick={() => onUpdate(seed.id, { status: status.id })}>
              {status.label}
            </button>
          ))}
        </div>
        <label className="stake-label">
          Stake
          <input className="stake-field" inputMode="decimal" value={view.stake} placeholder="0" aria-label={`${label} stake`} onChange={(event) => onUpdate(seed.id, { stake: event.target.value })} />
        </label>
      </div>
      <p className="board-note">{note}</p>
    </li>
  )
}
