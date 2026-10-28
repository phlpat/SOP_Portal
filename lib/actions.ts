import type { ActionResult, AppData, ID, Priority, Sop, Status, StatusCategory, StatusColor } from './types'
import { PRIORITIES } from './types'

const now = () => new Date().toISOString()
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
const norm = (s: string) => s.trim().toLowerCase()
const fail = (error: string): ActionResult => ({ ok: false, error })
const ok = (data: AppData, message: string): ActionResult => ({ ok: true, data, message })

/* ---------- Streams ---------- */

export interface StreamInput {
  name: string
  description: string
}

function validateStream(data: AppData, input: StreamInput, id?: ID) {
  const name = input.name.trim()
  if (!name) return 'Stream name is required.'
  if (name.length > 80) return 'Stream name must be 80 characters or fewer.'
  if (data.streams.some((s) => s.id !== id && norm(s.name) === norm(name))) return `A stream named "${name}" already exists.`
  return null
}

export function addStream(data: AppData, input: StreamInput): ActionResult {
  const error = validateStream(data, input)
  if (error) return fail(error)
  const stream = { id: newId('str'), name: input.name.trim(), description: input.description.trim(), createdAt: now() }
  return ok({ ...data, streams: [...data.streams, stream] }, `Stream "${stream.name}" created.`)
}

export function updateStream(data: AppData, id: ID, input: StreamInput): ActionResult {
  if (!data.streams.some((s) => s.id === id)) return fail('Stream not found.')
  const error = validateStream(data, input, id)
  if (error) return fail(error)
  return ok(
    { ...data, streams: data.streams.map((s) => (s.id === id ? { ...s, name: input.name.trim(), description: input.description.trim() } : s)) },
    'Stream updated.',
  )
}

export function deleteStream(data: AppData, id: ID): ActionResult {
  const stream = data.streams.find((s) => s.id === id)
  if (!stream) return fail('Stream not found.')
  const wsIds = new Set(data.workstreams.filter((w) => w.streamId === id).map((w) => w.id))
  return ok(
    {
      ...data,
      streams: data.streams.filter((s) => s.id !== id),
      workstreams: data.workstreams.filter((w) => !wsIds.has(w.id)),
      sops: data.sops.filter((s) => !wsIds.has(s.workstreamId)),
    },
    `Stream "${stream.name}" deleted.`,
  )
}

/* ---------- Workstreams ---------- */

export interface WorkstreamInput {
  streamId: ID
  name: string
  description: string
  lead: string
}

function validateWorkstream(data: AppData, input: WorkstreamInput, id?: ID) {
  const name = input.name.trim()
  if (!input.streamId || !data.streams.some((s) => s.id === input.streamId)) return 'Please select a valid stream.'
  if (!name) return 'Workstream name is required.'
  if (name.length > 80) return 'Workstream name must be 80 characters or fewer.'
  if (data.workstreams.some((w) => w.id !== id && w.streamId === input.streamId && norm(w.name) === norm(name)))
    return `"${name}" already exists in this stream.`
  return null
}

export function addWorkstream(data: AppData, input: WorkstreamInput): ActionResult {
  const error = validateWorkstream(data, input)
  if (error) return fail(error)
  const ws = {
    id: newId('ws'),
    streamId: input.streamId,
    name: input.name.trim(),
    description: input.description.trim(),
    lead: input.lead.trim(),
    createdAt: now(),
  }
  return ok({ ...data, workstreams: [...data.workstreams, ws] }, `Workstream "${ws.name}" created.`)
}

export function updateWorkstream(data: AppData, id: ID, input: WorkstreamInput): ActionResult {
  if (!data.workstreams.some((w) => w.id === id)) return fail('Workstream not found.')
  const error = validateWorkstream(data, input, id)
  if (error) return fail(error)
  return ok(
    {
      ...data,
      workstreams: data.workstreams.map((w) =>
        w.id === id
          ? { ...w, streamId: input.streamId, name: input.name.trim(), description: input.description.trim(), lead: input.lead.trim() }
          : w,
      ),
    },
    'Workstream updated.',
  )
}

export function deleteWorkstream(data: AppData, id: ID): ActionResult {
  const ws = data.workstreams.find((w) => w.id === id)
  if (!ws) return fail('Workstream not found.')
  return ok(
    { ...data, workstreams: data.workstreams.filter((w) => w.id !== id), sops: data.sops.filter((s) => s.workstreamId !== id) },
    `Workstream "${ws.name}" deleted.`,
  )
}

/* ---------- SOPs ---------- */

export interface SopInput {
  code: string
  name: string
  workstreamId: ID
  owner: string
  statusId: ID
  priority: Priority
  targetDate: string
  description: string
}

export type SopFieldErrors = Partial<Record<keyof SopInput | 'streamId', string>>

export function validateSop(data: AppData, input: SopInput, id?: ID): SopFieldErrors {
  const errors: SopFieldErrors = {}
  const code = input.code.trim()
  if (!code) errors.code = 'SOP ID is required.'
  else if (!/^[A-Za-z0-9._-]+$/.test(code)) errors.code = 'Use letters, numbers, dots, dashes or underscores only.'
  else if (data.sops.some((s) => s.id !== id && norm(s.code) === norm(code))) errors.code = `SOP ID "${code}" is already in use.`
  if (!input.name.trim()) errors.name = 'SOP name is required.'
  if (!input.workstreamId || !data.workstreams.some((w) => w.id === input.workstreamId)) errors.workstreamId = 'Select a workstream.'
  if (!input.owner.trim()) errors.owner = 'PIC / Owner is required.'
  if (!data.statuses.some((s) => s.id === input.statusId)) errors.statusId = 'Select a status.'
  if (!PRIORITIES.includes(input.priority)) errors.priority = 'Select a priority.'
  if (!input.targetDate) errors.targetDate = 'Target date is required.'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)) errors.targetDate = 'Invalid date.'
  return errors
}

function cleanSop(input: SopInput) {
  return {
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    workstreamId: input.workstreamId,
    owner: input.owner.trim(),
    statusId: input.statusId,
    priority: input.priority,
    targetDate: input.targetDate,
    description: input.description.trim(),
  }
}

export function addSop(data: AppData, input: SopInput): ActionResult {
  const errors = validateSop(data, input)
  const first = Object.values(errors)[0]
  if (first) return fail(first)
  const ts = now()
  const sop: Sop = { id: newId('sop'), ...cleanSop(input), createdAt: ts, updatedAt: ts }
  return ok({ ...data, sops: [...data.sops, sop] }, `${sop.code} created.`)
}

export function updateSop(data: AppData, id: ID, input: SopInput): ActionResult {
  if (!data.sops.some((s) => s.id === id)) return fail('SOP not found.')
  const errors = validateSop(data, input, id)
  const first = Object.values(errors)[0]
  if (first) return fail(first)
  const clean = cleanSop(input)
  return ok({ ...data, sops: data.sops.map((s) => (s.id === id ? { ...s, ...clean, updatedAt: now() } : s)) }, `${clean.code} updated.`)
}

export function deleteSop(data: AppData, id: ID): ActionResult {
  const sop = data.sops.find((s) => s.id === id)
  if (!sop) return fail('SOP not found.')
  return ok({ ...data, sops: data.sops.filter((s) => s.id !== id) }, `${sop.code} deleted.`)
}

/* ---------- Statuses ---------- */

export interface StatusInput {
  name: string
  color: StatusColor
  category: StatusCategory
  countsAsComplete: boolean
}

function validateStatus(data: AppData, input: StatusInput, id?: ID) {
  const name = input.name.trim()
  if (!name) return 'Status name is required.'
  if (name.length > 40) return 'Status name must be 40 characters or fewer.'
  if (data.statuses.some((s) => s.id !== id && norm(s.name) === norm(name))) return `Status "${name}" already exists.`
  return null
}

function reindex(statuses: Status[]) {
  return [...statuses].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }))
}

export function addStatus(data: AppData, input: StatusInput): ActionResult {
  const error = validateStatus(data, input)
  if (error) return fail(error)
  const status: Status = { id: newId('st'), name: input.name.trim(), color: input.color, category: input.category, countsAsComplete: input.countsAsComplete, active: true, order: data.statuses.length }
  return ok({ ...data, statuses: reindex([...data.statuses, status]) }, `Status "${status.name}" added.`)
}

export function updateStatus(data: AppData, id: ID, input: StatusInput): ActionResult {
  const existing = data.statuses.find((s) => s.id === id)
  if (!existing) return fail('Status not found.')
  const error = validateStatus(data, input, id)
  if (error) return fail(error)
  if (existing.countsAsComplete && !input.countsAsComplete && data.statuses.filter((s) => s.countsAsComplete).length === 1)
    return fail('At least one status must count as completed.')
  return ok(
    { ...data, statuses: data.statuses.map((s) => (s.id === id ? { ...s, ...input, name: input.name.trim() } : s)) },
    'Status updated.',
  )
}

export function setCompletionStatus(data: AppData, id: ID, value: boolean): ActionResult {
  const status = data.statuses.find((s) => s.id === id)
  if (!status) return fail('Status not found.')
  if (!value && data.statuses.filter((s) => s.countsAsComplete).length === 1 && status.countsAsComplete)
    return fail('At least one status must count as completed.')
  return ok(
    { ...data, statuses: data.statuses.map((s) => (s.id === id ? { ...s, countsAsComplete: value } : s)) },
    value ? `"${status.name}" now counts as completed.` : `"${status.name}" no longer counts as completed.`,
  )
}

export function toggleStatusActive(data: AppData, id: ID): ActionResult {
  const status = data.statuses.find((s) => s.id === id)
  if (!status) return fail('Status not found.')
  if (status.active && data.statuses.filter((s) => s.active).length === 1) return fail('At least one status must remain active.')
  return ok(
    { ...data, statuses: data.statuses.map((s) => (s.id === id ? { ...s, active: !s.active } : s)) },
    status.active ? `"${status.name}" deactivated.` : `"${status.name}" reactivated.`,
  )
}

export function moveStatus(data: AppData, id: ID, direction: -1 | 1): ActionResult {
  const list = reindex(data.statuses)
  const idx = list.findIndex((s) => s.id === id)
  const target = idx + direction
  if (idx < 0 || target < 0 || target >= list.length) return fail('Cannot move status further.')
  ;[list[idx], list[target]] = [list[target], list[idx]]
  return ok({ ...data, statuses: list.map((s, i) => ({ ...s, order: i })) }, 'Status order updated.')
}

export function deleteStatus(data: AppData, id: ID): ActionResult {
  const status = data.statuses.find((s) => s.id === id)
  if (!status) return fail('Status not found.')
  const used = data.sops.filter((s) => s.statusId === id).length
  if (used > 0) return fail(`"${status.name}" is used by ${used} SOP${used === 1 ? '' : 's'}. Deactivate it instead, or reassign those SOPs first.`)
  const remaining = data.statuses.filter((s) => s.id !== id)
  if (!remaining.some((s) => s.countsAsComplete)) return fail('At least one status must count as completed.')
  if (!remaining.some((s) => s.active)) return fail('At least one status must remain active.')
  return ok({ ...data, statuses: reindex(remaining) }, `Status "${status.name}" deleted.`)
}
