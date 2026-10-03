import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { GamePage } from './pages/Game.tsx'
import { ScoreboardPage } from './pages/Scoreboard.tsx'
import { StandingsPage } from './pages/Standings.tsx'
import { TeamPage } from './pages/Team.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<ScoreboardPage />} />
          <Route path="/game/:gamePk" element={<GamePage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/team/:teamId" element={<TeamPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
