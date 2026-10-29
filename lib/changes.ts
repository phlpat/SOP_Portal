import { PRIORITIES, STATUS_CATEGORIES, STATUS_COLORS, type AppData, type ID } from './types'

/**
 * A row-level diff between two AppData snapshots. The pure actions in actions.ts
 * keep producing whole AppData objects; only the diff travels to the database,
 * so two people editing different rows do not overwrite each other.
 */
export interface TableChanges<T> {
  upsert: T[]
  remove: ID[]
}

export interface DataChanges {
  streams: TableChanges<AppData['streams'][number]>
  workstreams: TableChanges<AppData['workstreams'][number]>
  statuses: TableChanges<AppData['statuses'][number]>
  sops: TableChanges<AppData['sops'][number]>
  /** Full stream id order, present only when streams were added, removed or reordered. */
  streamOrder?: ID[]
}

function diffTable<T extends { id: ID }>(prev: T[], next: T[]): TableChanges<T> {
  const before = new Map(prev.map((r) => [r.id, JSON.stringify(r)]))
  const nextIds = new Set(next.map((r) => r.id))
  return {
    upsert: next.filter((r) => before.get(r.id) !== JSON.stringify(r)),
    remove: prev.filter((r) => !nextIds.has(r.id)).map((r) => r.id),
  }
}

export function computeChanges(prev: AppData, next: AppData): DataChanges {
  const changes: DataChanges = {
    streams: diffTable(prev.streams, next.streams),
    workstreams: diffTable(prev.workstreams, next.workstreams),
    statuses: diffTable(prev.statuses, next.statuses),
    sops: diffTable(prev.sops, next.sops),
  }
  const order = (d: AppData) => d.streams.map((s) => s.id).join('\n')
  if (order(prev) !== order(next)) changes.streamOrder = next.streams.map((s) => s.id)
  return changes
}

export function hasChanges(c: DataChanges) {
  return (
    c.streamOrder !== undefined ||
    [c.streams, c.workstreams, c.statuses, c.sops].some((t) => t.upsert.length > 0 || t.remove.length > 0)
  )
}

/* ---------- Validation (runs on the server: the client is not trusted) ---------- */

type FieldType = 'string' | 'number' | 'boolean'
type Spec = Record<string, FieldType | readonly string[]>

const MAX_ROWS = 5000
const MAX_TEXT = 2000

const STREAM_SPEC: Spec = { id: 'string', name: 'string', description: 'string', createdAt: 'string' }
const WORKSTREAM_SPEC: Spec = { id: 'string', streamId: 'string', name: 'string', description: 'string', lead: 'string', createdAt: 'string' }
const STATUS_SPEC: Spec = {
  id: 'string',
  name: 'string',
  color: STATUS_COLORS,
  order: 'number',
  active: 'boolean',
  category: STATUS_CATEGORIES.map((c) => c.value),
  countsAsComplete: 'boolean',
}
const SOP_SPEC: Spec = {
  id: 'string',
  code: 'string',
  name: 'string',
  workstreamId: 'string',
  owner: 'string',
  statusId: 'string',
  priority: PRIORITIES,
  targetDate: 'string',
  description: 'string',
  createdAt: 'string',
  updatedAt: 'string',
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function parseRow(row: unknown, spec: Spec, table: string): Record<string, unknown> {
  if (!isRecord(row)) throw new Error(`Invalid ${table} row.`)
  const clean: Record<string, unknown> = {}
  for (const [key, type] of Object.entries(spec)) {
    const value = row[key]
    if (typeof type === 'string') {
      if (typeof value !== type) throw new Error(`Invalid ${table}.${key}.`)
      if (type === 'string' && (value as string).length > MAX_TEXT) throw new Error(`${table}.${key} is too long.`)
      if (type === 'number' && !Number.isFinite(value)) throw new Error(`Invalid ${table}.${key}.`)
    } else if (typeof value !== 'string' || !type.includes(value)) {
      throw new Error(`Invalid ${table}.${key}.`)
    }
    clean[key] = value
  }
  if (!(clean.id as string)) throw new Error(`Missing ${table}.id.`)
  return clean
}

function parseTable<T>(input: unknown, spec: Spec, table: string): TableChanges<T> {
  if (!isRecord(input) || !Array.isArray(input.upsert) || !Array.isArray(input.remove)) throw new Error(`Invalid ${table} changes.`)
  if (input.upsert.length > MAX_ROWS || input.remove.length > MAX_ROWS) throw new Error(`Too many ${table} changes.`)
  const remove = input.remove.map((id) => {
    if (typeof id !== 'string' || !id) throw new Error(`Invalid ${table} id.`)
    return id
  })
  return { upsert: input.upsert.map((r) => parseRow(r, spec, table) as T), remove }
}

/** Throws on anything that does not match the expected shape; returns a cleaned copy. */
export function parseChanges(input: unknown): DataChanges {
  if (!isRecord(input)) throw new Error('Invalid changes.')
  const changes: DataChanges = {
    streams: parseTable(input.streams, STREAM_SPEC, 'streams'),
    workstreams: parseTable(input.workstreams, WORKSTREAM_SPEC, 'workstreams'),
    statuses: parseTable(input.statuses, STATUS_SPEC, 'statuses'),
    sops: parseTable(input.sops, SOP_SPEC, 'sops'),
  }
  if (input.streamOrder !== undefined) {
    if (!Array.isArray(input.streamOrder) || input.streamOrder.length > MAX_ROWS || input.streamOrder.some((id) => typeof id !== 'string')) {
      throw new Error('Invalid stream order.')
    }
    changes.streamOrder = input.streamOrder as ID[]
  }
  return changes
}
