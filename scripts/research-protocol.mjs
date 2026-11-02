/**
 * How far a game is researched. The four reads still run for every game.
 * A higher level adds work. It does not add a model.
 *
 * screen: the posted number against the four reads. A Pass stops here.
 * log: the matching-slice games, before a Bet is sent.
 * personnel: a named game or a placed ticket. Absences, debuts, and a game script.
 * local: a thin public league. A local report before that alert is final.
 */

export const RESEARCH = {
  screen: {
    level: 1,
    name: 'screen',
    work: 'Four reads against the posted number.',
  },
  log: {
    level: 2,
    name: 'log',
    work: 'Read the matching-slice games before the link.',
  },
  personnel: {
    level: 3,
    name: 'personnel',
    work: 'Sourced absences, debuts, and a game script.',
  },
  local: {
    level: 4,
    name: 'local',
    work: 'A local report before the alert is final.',
  },
}

const THIN = /\b(fcs|j1|j2|j3)\b/i

export function thinPublicLeague(title, sportPath = '') {
  return THIN.test(`${title ?? ''} ${sportPath ?? ''}`)
}

export function researchLevel({
  action = 'Pass',
  thinPublic = false,
  named = false,
  placed = false,
  live = false,
} = {}) {
  if (live && !placed && !named) {
    return layer('screen', 'Live, and no ticket is placed. Clock and number only.')
  }
  if (thinPublic && (named || placed || isBet(action))) {
    return layer('local', 'Thin public log. Finish with a local report before the alert is final.')
  }
  if (named || placed) {
    return layer('personnel', placed ? 'A ticket is placed.' : 'The game was named.')
  }
  if (isBet(action)) {
    return layer('log', 'The screen says Bet. Read the matching-slice games before the link.')
  }
  return layer('screen', 'The screen is not a Bet. Stop.')
}

function isBet(action) {
  return action === 'Bet' || action === 'Bet now'
}

function layer(name, reason) {
  return { ...RESEARCH[name], reason }
}
