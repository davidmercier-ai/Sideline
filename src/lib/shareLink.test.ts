import assert from 'node:assert/strict'
import { messageLink, shareMessage } from './shareLink.ts'

const dk =
  'https://sportsbook.draftkings.com/event/34118052?outcomes=0QA382657149%232340421956_13L88808Q1978517959Q20'
const fd =
  'https://sportsbook.fanduel.com/addToBetslip?marketId[0]=739.194368215&selectionId[0]=95394736&marketId[1]=739.194368215&selectionId[1]=62271373'
const crossed = 'https://sportsbook.draftkings.com/?outcomes=0QA382779352%232336626402_13L88808Q1'

const dkLink = messageLink(dk)
assert.equal(dkLink.includes('#'), false)
assert.equal(dkLink.includes('%2523'), false)
assert.equal(dkLink.includes('%23'), true)
assert.equal(new URL(dkLink).searchParams.get('outcomes')?.includes('#'), true)

const fdLink = messageLink(fd)
assert.equal(fdLink.includes('['), false)
assert.equal(fdLink.includes('%5B0%5D'), true)
const params = new URL(fdLink).searchParams
assert.equal(params.get('marketId[0]'), '739.194368215')
assert.equal(params.get('selectionId[1]'), '62271373')

const rawHash = messageLink('https://sportsbook.draftkings.com/event/1?outcomes=0QA2#3')
assert.equal(rawHash.includes('#'), false)
assert.equal(new URL(rawHash).searchParams.get('outcomes'), '0QA2#3')

const message = shareMessage('DraftKings over 22.5 −113', 'Browns at Steelers', dk)
assert.equal(message.includes(dkLink), true)
assert.equal(message.includes('Confirm the player and the number'), true)
assert.equal(message.includes('Safari'), false)

const safari = shareMessage('Pardon My Take', 'Dolphins and Commanders', crossed)
assert.equal(safari.includes('Open the DraftKings link in Safari.'), true)
assert.equal(messageLink(crossed).includes('%23'), true)

console.log('share link ok')
