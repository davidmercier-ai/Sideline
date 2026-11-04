/**
 * A link that survives a text message.
 * A raw # is a fragment, so Messages drops the rest of a DraftKings selection id.
 * FanDuel's own share link runs encodeURI, which turns marketId[0] into marketId%5B0%5D.
 * Opening the link does not place the bet.
 */
export function messageLink(href: string): string {
  return href.replaceAll('#', '%23').replaceAll('[', '%5B').replaceAll(']', '%5D')
}

export function shareMessage(label: string, detail: string, href: string, confirm = 'Confirm the player and the number on the slip.'): string {
  const link = messageLink(href)
  const safari = link.startsWith('https://sportsbook.draftkings.com/?')
  const where = safari ? ' Open the DraftKings link in Safari.' : ''
  return `${label}. ${detail}.${where} ${confirm}\n${link}`
}

export async function sendBetLink(message: string): Promise<'shared' | 'copied' | 'dismissed' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: message })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed'
    }
  }
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return 'failed'
    await navigator.clipboard.writeText(message)
    return 'copied'
  } catch {
    return 'failed'
  }
}
