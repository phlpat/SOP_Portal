import { useCallback, useEffect, useState } from 'react'

/** Columns of the SOP table that the user can show, hide and reorder. Actions are always pinned on the right. */
export const COLUMN_KEYS = ['code', 'name', 'stream', 'workstream', 'owner', 'status', 'priority', 'targetDate', 'updatedAt'] as const
export type ColumnKey = (typeof COLUMN_KEYS)[number]

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  code: 'SOP ID',
  name: 'SOP Name',
  stream: 'Stream',
  workstream: 'Workstream',
  owner: 'PIC / Owner',
  status: 'Status',
  priority: 'Priority',
  targetDate: 'Target Date',
  updatedAt: 'Last Updated',
}

export interface ColumnConfig {
  order: ColumnKey[]
  hidden: ColumnKey[]
}

export const DEFAULT_COLUMN_CONFIG: ColumnConfig = { order: [...COLUMN_KEYS], hidden: [] }

/** A view preference rather than shared data, so it is kept in this browser only. */
const STORAGE_KEY = 'sop-tracker:sop-columns:v1'

const isKey = (v: unknown): v is ColumnKey => typeof v === 'string' && (COLUMN_KEYS as readonly string[]).includes(v)

/** Accepts anything read from storage and returns a config that is always safe to render. */
export function normalizeColumnConfig(raw: unknown): ColumnConfig {
  const value = (raw && typeof raw === 'object' ? raw : {}) as { order?: unknown; hidden?: unknown }
  const saved = Array.isArray(value.order) ? value.order.filter(isKey) : []
  // Columns added in a later version are appended instead of being lost.
  const order = [...new Set([...saved, ...COLUMN_KEYS])]
  const hidden = Array.isArray(value.hidden) ? [...new Set(value.hidden.filter(isKey))] : []
  return { order, hidden: hidden.length >= order.length ? [] : hidden }
}

export function useColumnConfig() {
  const [config, setConfig] = useState<ColumnConfig>(DEFAULT_COLUMN_CONFIG)

  // Read after mount so the server render and the first client render match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setConfig(normalizeColumnConfig(JSON.parse(raw)))
    } catch {
      // Unreadable storage keeps the defaults.
    }
  }, [])

  const update = useCallback((next: ColumnConfig) => {
    const clean = normalizeColumnConfig(next)
    setConfig(clean)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
    } catch {
      // Private mode or full storage: the choice still applies until the page is closed.
    }
  }, [])

  return [config, update] as const
}
