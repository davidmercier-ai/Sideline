import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  {
    to: '/',
    label: 'Today',
    match: (path: string) => path === '/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M3 12h2M19 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />
      </svg>
    ),
  },
  {
    to: '/mlb',
    label: 'MLB',
    match: (path: string) =>
      path.startsWith('/mlb') || path.startsWith('/game') || path.startsWith('/team') || path.startsWith('/standings'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 20 12l-8 8.5L4 12l8-8.5Z" />
      </svg>
    ),
  },
  {
    to: '/soccer',
    label: 'Soccer',
    match: (path: string) => path.startsWith('/soccer'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    to: '/nba',
    label: 'NBA',
    match: (path: string) => path.startsWith('/nba'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 16c4-7 12-7 16 0" />
        <path d="M5 8h14" />
      </svg>
    ),
  },
  {
    to: '/nhl',
    label: 'NHL',
    match: (path: string) => path.startsWith('/nhl'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
] as const

export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav className="tab-bar" aria-label="Primary">
      {TABS.map((tab) => {
        const active = tab.match(pathname)
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={active ? 'active' : undefined}
            aria-current={active ? 'page' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
