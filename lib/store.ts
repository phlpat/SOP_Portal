import type { AppData } from './types'
import { computeChanges, hasChanges } from './changes'
import { loadData, saveChanges } from './data-actions'

/**
 * Client cache of the database. Reads are served from `state`; writes update it
 * immediately (optimistic) and are sent to the server in order. If a save fails the
 * cache is reloaded from the server so the screen never keeps data that was not stored.
 */
type Listener = () => void
const listeners = new Set<Listener>()
let state: AppData | null = null
let pending = 0
let queue: Promise<void> = Promise.resolve()

function emit() {
  listeners.forEach((l) => l())
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): AppData | null {
  return state
}

export function getServerSnapshot(): AppData | null {
  return null
}

/** Fetches the latest data. Skipped while local edits are still being saved. */
export async function reload(): Promise<void> {
  if (pending > 0) return
  const fresh = await loadData()
  if (pending > 0) return
  state = fresh
  emit()
}

/** Shows `next` immediately and persists the difference from the current data. */
export function commitData(next: AppData): Promise<void> {
  const prev = state
  state = next
  emit()
  if (!prev) return Promise.resolve()
  const changes = computeChanges(prev, next)
  if (!hasChanges(changes)) return Promise.resolve()

  pending++
  const saved = queue.then(() => saveChanges(changes))
  queue = saved.catch(() => undefined)
  return saved
    .catch(async (error) => {
      pending--
      await reload().catch(() => undefined)
      throw error
    })
    .then(() => {
      // Only reached on success; the catch above already decremented on failure.
      pending--
    })
}
