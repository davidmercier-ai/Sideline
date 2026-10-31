/**
 * One store per board. The markdown report is the reading copy.
 * This file is what a later run opens when the board is asked for again.
 *
 * docs/projections/stores/<id>.json
 * docs/projections/stores/index.json
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const STORE_DIR = 'docs/projections/stores'

export function boardStoreId(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function saveBoard(record, dir = STORE_DIR) {
  if (!record?.id || !record?.title) throw new Error('A board store needs an id and a title')
  await mkdir(dir, { recursive: true })
  const path = join(dir, `${record.id}.json`)
  const body = {
    id: record.id,
    title: record.title,
    sportPath: record.sportPath ?? null,
    retrievedAt: record.retrievedAt ?? new Date().toISOString(),
    games: record.games ?? [],
  }
  await writeFile(path, `${JSON.stringify(body, null, 2)}\n`)
  const indexPath = join(dir, 'index.json')
  let index = []
  try {
    index = JSON.parse(await readFile(indexPath, 'utf8'))
  } catch {
    index = []
  }
  const next = index.filter((row) => row.id !== body.id)
  next.push({
    id: body.id,
    title: body.title,
    retrievedAt: body.retrievedAt,
    games: body.games.length,
  })
  next.sort((left, right) => left.id.localeCompare(right.id))
  await writeFile(indexPath, `${JSON.stringify(next, null, 2)}\n`)
  return path
}

export async function loadBoard(id, dir = STORE_DIR) {
  const raw = await readFile(join(dir, `${boardStoreId(id)}.json`), 'utf8')
  return JSON.parse(raw)
}

export function storePath(outputPath) {
  return dirname(outputPath)
}
