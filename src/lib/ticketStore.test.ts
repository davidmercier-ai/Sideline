import assert from 'node:assert/strict'
import { ticketView } from './ticketStore.ts'

const won = { id: 'dk-cook', defaultStatus: 'open' as const, defaultStake: '', result: 'won' as const }
const lost = { id: 'dk-warren', defaultStatus: 'open' as const, defaultStake: '', result: 'lost' as const }
const live = { id: 'dk-gray', defaultStatus: 'placed' as const, defaultStake: '1' }

assert.deepEqual(ticketView(won, {}), { status: 'won', stake: '' })
assert.deepEqual(ticketView(lost, { 'dk-warren': { status: 'placed', stake: '10' } }), { status: 'lost', stake: '10' })
assert.deepEqual(ticketView(won, { 'dk-cook': { status: 'push', stake: '5' } }), { status: 'push', stake: '5' })
assert.deepEqual(ticketView(live, {}), { status: 'placed', stake: '1' })

console.log('ticket log ok')
