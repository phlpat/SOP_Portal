import type { AppData } from './types'
import { createSampleData } from './sample-data'

const STORAGE_KEY = 'sop-tracker:data:v1'

type Listener = () => void
const listeners = new Set<Listener>()
let state: AppData | null = null

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<AppData>
  return Array.isArray(v.streams) && Array.isArray(v.workstreams) && Array.isArray(v.statuses) && Array.isArray(v.sops)
}

function readFromStorage(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isAppData(parsed)) return parsed
    }
  } catch {
    // Corrupt or inaccessible storage falls back to sample data below.
  }
  const seeded = createSampleData()
  writeToStorage(seeded)
  return seeded
}

function writeToStorage(data: AppData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Quota exceeded or private mode: keep working in memory.
  }
}

function emit() {
  listeners.forEach((l) => l())
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    state = readFromStorage()
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function getSnapshot(): AppData {
  if (!state) state = readFromStorage()
  return state
}

export function getServerSnapshot(): AppData | null {
  return null
}

export function replaceData(next: AppData) {
  state = next
  writeToStorage(next)
  emit()
}
