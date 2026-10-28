import type { AppData, ID, Sop, Status, Stream, Workstream } from './types'

export function sortedStatuses(data: AppData): Status[] {
  return [...data.statuses].sort((a, b) => a.order - b.order)
}

export function indexById<T extends { id: ID }>(items: T[]): Map<ID, T> {
  return new Map(items.map((i) => [i.id, i]))
}

export function isSopComplete(sop: Sop, statuses: Map<ID, Status>) {
  return statuses.get(sop.statusId)?.countsAsComplete ?? false
}

export function rate(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

export interface ProgramMetrics {
  streams: number
  workstreams: number
  sops: number
  completed: number
  inProgress: number
  pending: number
  notStarted: number
  onHold: number
  overdue: number
  completionRate: number
}

export function getProgramMetrics(data: AppData, today = new Date()): ProgramMetrics {
  const statuses = indexById(data.statuses)
  const todayStr = toDateInput(today)
  const m: ProgramMetrics = {
    streams: data.streams.length,
    workstreams: data.workstreams.length,
    sops: data.sops.length,
    completed: 0,
    inProgress: 0,
    pending: 0,
    notStarted: 0,
    onHold: 0,
    overdue: 0,
    completionRate: 0,
  }
  for (const sop of data.sops) {
    const status = statuses.get(sop.statusId)
    if (status?.countsAsComplete) {
      m.completed++
      continue
    }
    if (sop.targetDate && sop.targetDate < todayStr) m.overdue++
    switch (status?.category) {
      case 'in_progress':
        m.inProgress++
        break
      case 'pending':
        m.pending++
        break
      case 'on_hold':
        m.onHold++
        break
      default:
        m.notStarted++
    }
  }
  m.completionRate = rate(m.completed, m.sops)
  return m
}

/** Narrows the data to one stream so the program-level metrics can be reused per stream. */
export function scopeToStream(data: AppData, streamId: ID): AppData {
  const workstreams = data.workstreams.filter((w) => w.streamId === streamId)
  const wsIds = new Set(workstreams.map((w) => w.id))
  return {
    ...data,
    streams: data.streams.filter((s) => s.id === streamId),
    workstreams,
    sops: data.sops.filter((s) => wsIds.has(s.workstreamId)),
  }
}

export interface GroupStats {
  workstreamCount: number
  sopCount: number
  completed: number
  completionRate: number
}

export function getStreamStats(data: AppData): Map<ID, GroupStats> {
  const statuses = indexById(data.statuses)
  const wsToStream = new Map(data.workstreams.map((w) => [w.id, w.streamId]))
  const stats = new Map<ID, GroupStats>(
    data.streams.map((s) => [s.id, { workstreamCount: 0, sopCount: 0, completed: 0, completionRate: 0 }]),
  )
  for (const ws of data.workstreams) {
    const s = stats.get(ws.streamId)
    if (s) s.workstreamCount++
  }
  for (const sop of data.sops) {
    const s = stats.get(wsToStream.get(sop.workstreamId) ?? '')
    if (!s) continue
    s.sopCount++
    if (isSopComplete(sop, statuses)) s.completed++
  }
  stats.forEach((s) => (s.completionRate = rate(s.completed, s.sopCount)))
  return stats
}

export function getWorkstreamStats(data: AppData): Map<ID, GroupStats> {
  const statuses = indexById(data.statuses)
  const stats = new Map<ID, GroupStats>(
    data.workstreams.map((w) => [w.id, { workstreamCount: 1, sopCount: 0, completed: 0, completionRate: 0 }]),
  )
  for (const sop of data.sops) {
    const s = stats.get(sop.workstreamId)
    if (!s) continue
    s.sopCount++
    if (isSopComplete(sop, statuses)) s.completed++
  }
  stats.forEach((s) => (s.completionRate = rate(s.completed, s.sopCount)))
  return stats
}

export function getStatusDistribution(data: AppData) {
  const counts = new Map<ID, number>()
  for (const sop of data.sops) counts.set(sop.statusId, (counts.get(sop.statusId) ?? 0) + 1)
  return sortedStatuses(data).map((status) => ({ status, count: counts.get(status.id) ?? 0 }))
}

export interface SopRow extends Sop {
  stream?: Stream
  workstream?: Workstream
  status?: Status
}

export function buildSopRows(data: AppData): SopRow[] {
  const ws = indexById(data.workstreams)
  const st = indexById(data.streams)
  const statuses = indexById(data.statuses)
  return data.sops.map((sop) => {
    const workstream = ws.get(sop.workstreamId)
    return {
      ...sop,
      workstream,
      stream: workstream ? st.get(workstream.streamId) : undefined,
      status: statuses.get(sop.statusId),
    }
  })
}

export function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDate(value: string) {
  if (!value) return '—'
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
