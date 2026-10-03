import { NavLink } from 'react-router-dom'

export function Header() {
  return (
    <header className="site-header">
      <NavLink to="/" className="brand" aria-label="Sideline home">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>
          <span className="brand-name">Sideline</span>
          <span className="brand-kicker">Field-level sports</span>
        </span>
      </NavLink>
      <nav className="nav" aria-label="Primary">
        <NavLink to="/" end>
          Scoreboard
        </NavLink>
        <NavLink to="/standings">Standings</NavLink>
        <NavLink to="/soccer">Soccer</NavLink>
        <NavLink to="/nba">NBA</NavLink>
      </nav>
    </header>
  )
}
