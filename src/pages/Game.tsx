import { Link, useParams } from 'react-router-dom'
import { Diamond } from '../components/Diamond'
import { LeanMeter } from '../components/LeanMeter'
import { LinescoreTable } from '../components/Linescore'
import { TeamMark } from '../components/TeamMark'
import { fetchLiveGame, fetchPitcherStats, fetchPublicLines, lineKey } from '../lib/api'
import {
  inningLabel,
  isFinal,
  isLive,
  lastName,
  personName,
  recordText,
  seasonFromDate,
  statNum,
  teamAbbr,
} from '../lib/format'
import { sidelineLean } from '../lib/lean'
import type { BoxTeam, LiveFeed, Named, PitcherSeason, PublicLine, WinRecord } from '../lib/types'
import { usePoll } from '../lib/usePoll'

export function GamePage() {
  const { gamePk } = useParams()
  const id = Number(gamePk)
  const { data, error, loading } = usePoll(
    () => fetchLiveGame(id),
    String(id),
    12000,
  )
  const officialDate = data?.gameData.datetime?.officialDate ?? ''
  const extraKey = `${id}-${officialDate}-${data?.gameData.probablePitchers?.away?.id ?? ''}-${data?.gameData.probablePitchers?.home?.id ?? ''}`
  const extras = usePoll(
    async () => {
      if (!officialDate) return { pitchers: {} as Record<number, PitcherSeason>, line: undefined as PublicLine | undefined }
      const ids = [
        data?.gameData.probablePitchers?.away?.id,
        data?.gameData.probablePitchers?.home?.id,
      ].filter((n): n is number => typeof n === 'number')
      const [pitchers, lines] = await Promise.all([
        fetchPitcherStats(ids, seasonFromDate(officialDate)),
        fetchPublicLines(officialDate),
      ])
      const awayAbbr = data?.gameData.teams?.away?.abbreviation
      const homeAbbr = data?.gameData.teams?.home?.abbreviation
      return { pitchers, line: lines[lineKey(awayAbbr, homeAbbr)] }
    },
    extraKey,
    60000,
  )

  if (!Number.isFinite(id)) return <p className="error">Missing game.</p>
  if (loading && !data) return <p className="loading">Getting the count from the dugout…</p>
  if (error) return <p className="error">{error}</p>
  if (!data) return null

  const away = data.gameData.teams?.away
  const home = data.gameData.teams?.home
  if (!away || !home) return <p className="error">Game data is incomplete.</p>

  const linescore = data.liveData.linescore
  const status = data.gameData.status
  const live = isLive(status)
  const final = isFinal(status)
  const started = live || final
  const awayScore = started ? (linescore?.teams?.away?.runs ?? 0) : undefined
  const homeScore = started ? (linescore?.teams?.home?.runs ?? 0) : undefined
  const lean = sidelineLean({
    awayRecord: away.record,
    homeRecord: home.record,
    awayPitcher: extras.data?.pitchers?.[data.gameData.probablePitchers?.away?.id ?? 0],
    homePitcher: extras.data?.pitchers?.[data.gameData.probablePitchers?.home?.id ?? 0],
  })
  const plays = [...(data.liveData.plays?.allPlays ?? [])].reverse().slice(0, 12)
  const current =
    data.liveData.plays?.currentPlay?.result?.description
      ? data.liveData.plays.currentPlay
      : plays[0]
  const card = {
    status: status ?? { abstractGameState: 'Preview', detailedState: 'Scheduled' },
    linescore,
    gameDate: data.gameData.datetime?.dateTime ?? new Date().toISOString(),
  }

  return (
    <main>
      <p style={{ marginTop: 20 }}>
        <Link className="back-link" to="/">
          ← Scoreboard
        </Link>
      </p>

      <section className="page-hero">
        <div>
          <p className={live ? 'live-pill' : final ? 'status-pill final-pill' : 'status-pill muted'}>
            {inningLabel(card)}
          </p>
          <h1>
            {away.teamName || teamAbbr(away)} at {home.teamName || teamAbbr(home)}
          </h1>
          <p className="lede">{weatherLine(data)}</p>
        </div>
      </section>

      <div className="layout-2">
        <section className="card scorebug">
          <ScoreTeam team={away} score={awayScore} dim={final && (awayScore ?? 0) < (homeScore ?? 0)} />
          <ScoreTeam team={home} score={homeScore} dim={final && (homeScore ?? 0) < (awayScore ?? 0)} />
          {live ? <Diamond linescore={linescore} /> : null}
          {current?.result?.description ? (
            <p>
              <span className="meta">Now</span>
              <br />
              {current.result.description}
            </p>
          ) : null}
          <p className="muted">
            {personName(data.gameData.probablePitchers?.away)} vs{' '}
            {personName(data.gameData.probablePitchers?.home)}
            {live && linescore?.defense?.pitcher
              ? ` · Pitching: ${lastName(linescore.defense.pitcher)}`
              : ''}
          </p>
        </section>

        <aside className="panel">
          <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
            The lean
          </h2>
          <LeanMeter
            away={away}
            home={home}
            awayPct={lean.away}
            homePct={lean.home}
            notes={lean.notes}
            line={extras.data?.line}
          />
          <p className="muted" style={{ marginTop: 14 }}>
            Comparison only. No bet slip. The public number is the DraftKings
            moneyline ESPN is showing, de-vigged.
          </p>
          {data.liveData.decisions ? (
            <p className="muted" style={{ marginTop: 14 }}>
              W {lastName(data.liveData.decisions.winner)} · L{' '}
              {lastName(data.liveData.decisions.loser)}
              {data.liveData.decisions.save
                ? ` · SV ${lastName(data.liveData.decisions.save)}`
                : ''}
            </p>
          ) : null}
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
          Linescore
        </h2>
        <LinescoreTable linescore={linescore} away={away} home={home} />
      </section>

      <div className="layout-2" style={{ marginTop: 14 }}>
        <section className="panel">
          <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
            Recent plays
          </h2>
          <div className="play-list">
            {plays.length === 0 ? <p className="muted">No plays yet.</p> : null}
            {plays.map((play, index) => (
              <article
                key={`${play.about?.inning}-${index}`}
                className={`play ${play.about?.isScoringPlay ? 'scoring' : ''}`}
              >
                <div className="row">
                  <span className="meta">
                    {play.about?.halfInning} {play.about?.inning}
                    {play.result?.event ? ` · ${play.result.event}` : ''}
                  </span>
                  <span className="meta">
                    {play.result?.awayScore}-{play.result?.homeScore}
                  </span>
                </div>
                <p>{play.result?.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
            Box
          </h2>
          <BoxSide label={teamAbbr(away)} team={data.liveData.boxscore?.teams?.away} />
          <div style={{ height: 18 }} />
          <BoxSide label={teamAbbr(home)} team={data.liveData.boxscore?.teams?.home} />
        </section>
      </div>
    </main>
  )
}

function ScoreTeam({
  team,
  score,
  dim,
}: {
  team: Named & { record?: WinRecord }
  score?: number
  dim?: boolean
}) {
  return (
    <div className="scorebug-team">
      <TeamMark
        team={team}
        record={recordText(team.record?.wins, team.record?.losses, team.record?.pct)}
      />
      <div className={`runs ${dim || score == null ? 'muted' : ''}`}>{score ?? '–'}</div>
    </div>
  )
}

function BoxSide({ label, team }: { label: string; team?: BoxTeam }) {
  const batters = (team?.battingOrder ?? team?.batters ?? [])
    .map((id) => team?.players?.[`ID${id}`])
    .filter((player) => player && Number(player.stats?.batting?.atBats ?? 0) > 0)
    .slice(0, 9)
  const pitchers = (team?.pitchers ?? [])
    .map((id) => team?.players?.[`ID${id}`])
    .filter(Boolean)
    .slice(0, 5)

  return (
    <div>
      <p className="meta">{label} batting</p>
      <table className="standings-table">
        <thead>
          <tr>
            <th>Player</th>
            <th className="num">AB</th>
            <th className="num">H</th>
            <th className="num">RBI</th>
          </tr>
        </thead>
        <tbody>
          {batters.map((player) => (
            <tr key={player?.person?.id}>
              <td>
                {player?.position?.abbreviation} {personName(player?.person)}
              </td>
              <td className="num">{statNum(player?.stats?.batting?.atBats)}</td>
              <td className="num">{statNum(player?.stats?.batting?.hits)}</td>
              <td className="num">{statNum(player?.stats?.batting?.rbi)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta" style={{ marginTop: 14 }}>
        {label} pitching
      </p>
      <table className="standings-table">
        <thead>
          <tr>
            <th>Pitcher</th>
            <th className="num">IP</th>
            <th className="num">K</th>
            <th className="num">ER</th>
          </tr>
        </thead>
        <tbody>
          {pitchers.map((player) => (
            <tr key={player?.person?.id}>
              <td>{personName(player?.person)}</td>
              <td className="num">{statNum(player?.stats?.pitching?.inningsPitched)}</td>
              <td className="num">{statNum(player?.stats?.pitching?.strikeOuts)}</td>
              <td className="num">{statNum(player?.stats?.pitching?.earnedRuns)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function weatherLine(feed: LiveFeed): string {
  const venue = feed.gameData.venue?.name
  const weather = feed.gameData.weather
  const parts = [venue]
  if (weather?.temp) parts.push(`${weather.temp}°`)
  if (weather?.condition && weather.condition !== 'None') parts.push(weather.condition)
  if (weather?.wind && !/^0 mph/i.test(weather.wind)) parts.push(weather.wind)
  return parts.filter(Boolean).join(' · ')
}
