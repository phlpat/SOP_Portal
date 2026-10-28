export type ID = string

export const STATUS_CATEGORIES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'on_hold', label: 'On hold' },
] as const

export type StatusCategory = (typeof STATUS_CATEGORIES)[number]['value']

export const STATUS_COLORS = ['slate', 'blue', 'indigo', 'violet', 'amber', 'orange', 'emerald', 'rose'] as const
export type StatusColor = (typeof STATUS_COLORS)[number]

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const
export type Priority = (typeof PRIORITIES)[number]

export interface Stream {
  id: ID
  name: string
  description: string
  createdAt: string
}

export interface Workstream {
  id: ID
  streamId: ID
  name: string
  description: string
  lead: string
  createdAt: string
}

export interface Status {
  id: ID
  name: string
  color: StatusColor
  order: number
  active: boolean
  /** Reporting bucket used for the In Progress / Pending summary cards. */
  category: StatusCategory
  /** When true, SOPs in this status count toward completion rates. */
  countsAsComplete: boolean
}

export interface Sop {
  id: ID
  code: string
  name: string
  /** Stream is derived from the workstream so the two can never disagree. */
  workstreamId: ID
  owner: string
  statusId: ID
  priority: Priority
  targetDate: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface AppData {
  version: 1
  streams: Stream[]
  workstreams: Workstream[]
  statuses: Status[]
  sops: Sop[]
}

export type ActionResult = { ok: true; data: AppData; message: string } | { ok: false; error: string }
