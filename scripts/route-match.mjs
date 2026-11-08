/**
 * Receiver throw against defensive personnel.
 *
 * The charted throw is length and location from the play file.
 * It is not a route name. FTN charting names box count, rushers,
 * and blitzers. It does not name man or zone, so coverage stays missing.
 * A favorable look is the receiver's own yards per target.
 * Nothing here enters the four models, and nothing here changes a Pass into a Bet.
 */

const MIN_TARGETS = 8
const MIN_DEFENSE = 20
const MIN_SHARE = 0.4
const YARD_BAND = 1.5

export function yardsPerTarget(bucket) {
  const targets = Number(bucket?.targets)
  const yards = Number(bucket?.yards)
  if (!targets) return null
  return yards / targets
}

export function personnelMatch(receiver, defense) {
  return {
    coverage: 'missing',
    changesBet: false,
    box: comparePair(receiver, defense, 'light_box', 'heavy_box', 'light box', 'heavy box'),
    rush: comparePair(receiver, defense, 'four_rush', 'extra_rush', 'four rushers', 'extra rushers'),
  }
}

export function comparePair(receiver, defense, leftKey, rightKey, leftLabel, rightLabel) {
  const left = receiver?.buckets?.[leftKey]
  const right = receiver?.buckets?.[rightKey]
  const defenseLeft = Number(defense?.[leftKey]) || 0
  const defenseRight = Number(defense?.[rightKey]) || 0
  const charted = defenseLeft + defenseRight
  const leftTargets = Number(left?.targets) || 0
  const rightTargets = Number(right?.targets) || 0
  if (charted < MIN_DEFENSE || leftTargets < MIN_TARGETS || rightTargets < MIN_TARGETS) {
    return {
      favorable: false,
      thin: true,
      text: `Thin sample. ${leftLabel} ${leftTargets} targets, ${rightLabel} ${rightTargets} targets. Defense chart ${charted}.`,
    }
  }
  const modalLeft = defenseLeft >= defenseRight
  const share = (modalLeft ? defenseLeft : defenseRight) / charted
  const modalLabel = modalLeft ? leftLabel : rightLabel
  const modalBucket = modalLeft ? left : right
  const otherBucket = modalLeft ? right : left
  const edge = yardsPerTarget(modalBucket) - yardsPerTarget(otherBucket)
  if (share < MIN_SHARE) {
    return {
      favorable: false,
      thin: false,
      edge,
      text: `No modal look. ${leftLabel} ${defenseLeft}, ${rightLabel} ${defenseRight}.`,
    }
  }
  const rounded = Math.round(edge * 10) / 10
  if (rounded >= YARD_BAND) {
    return {
      favorable: true,
      thin: false,
      edge: rounded,
      modal: modalLabel,
      targets: Number(modalBucket.targets),
      text: `${modalLabel} is ${Math.round(share * 100)}% of ${charted} charted plays. ${Number(modalBucket.targets)} targets there gain ${rounded} yards per target more than the other look.`,
    }
  }
  return {
    favorable: false,
    thin: false,
    edge: rounded,
    modal: modalLabel,
    targets: Number(modalBucket.targets),
    text: `${modalLabel} is ${Math.round(share * 100)}% of ${charted} charted plays. The rate there is ${rounded} yards per target versus the other look.`,
  }
}
