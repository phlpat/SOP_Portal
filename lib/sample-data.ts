import type { AppData, Priority, Sop, Status, Stream, Workstream } from './types'

const created = '2026-07-01T09:00:00.000Z'

export const DEFAULT_STATUSES: Status[] = [
  { id: 'st-not-started', name: 'Not Started', color: 'slate', order: 0, active: true, category: 'not_started', countsAsComplete: false },
  { id: 'st-in-progress', name: 'In Progress', color: 'blue', order: 1, active: true, category: 'in_progress', countsAsComplete: false },
  { id: 'st-pending-review', name: 'Pending Review', color: 'amber', order: 2, active: true, category: 'pending', countsAsComplete: false },
  { id: 'st-pending-signoff', name: 'Pending Sign-off', color: 'violet', order: 3, active: true, category: 'pending', countsAsComplete: false },
  { id: 'st-completed', name: 'Completed', color: 'emerald', order: 4, active: true, category: 'in_progress', countsAsComplete: true },
  { id: 'st-on-hold', name: 'On Hold', color: 'rose', order: 5, active: true, category: 'on_hold', countsAsComplete: false },
]

const streams: Stream[] = [
  {
    id: 'str-store-ops',
    name: 'Store Operations',
    description: 'Standardising in-store processes across the retail estate.',
    createdAt: created,
  },
  {
    id: 'str-supply-chain',
    name: 'Supply Chain & Inventory',
    description: 'Replenishment, distribution centre and stock accuracy procedures.',
    createdAt: created,
  },
]

const workstreams: Workstream[] = [
  { id: 'ws-opening', streamId: 'str-store-ops', name: 'Store Opening & Closing', description: 'Daily open/close routines and cash handling.', lead: 'Aisha Rahman', createdAt: created },
  { id: 'ws-customer', streamId: 'str-store-ops', name: 'Customer Service', description: 'Returns, complaints and service recovery.', lead: 'Daniel Lim', createdAt: created },
  { id: 'ws-visual', streamId: 'str-store-ops', name: 'Visual Merchandising', description: 'Planogram compliance and promotional setups.', lead: 'Priya Nair', createdAt: created },
  { id: 'ws-replen', streamId: 'str-supply-chain', name: 'Replenishment', description: 'Auto-replenishment and manual ordering.', lead: 'Marcus Tan', createdAt: created },
  { id: 'ws-receiving', streamId: 'str-supply-chain', name: 'Goods Receiving', description: 'Inbound deliveries, checks and discrepancies.', lead: 'Sofia Alvarez', createdAt: created },
]

type SopSeed = [code: string, name: string, ws: string, owner: string, status: string, priority: Priority, target: string, updated: string]

const sopSeeds: SopSeed[] = [
  ['SOP-OPS-001', 'Store opening checklist', 'ws-opening', 'Aisha Rahman', 'st-completed', 'High', '2026-08-15', '2026-08-12'],
  ['SOP-OPS-002', 'Cash float & till reconciliation', 'ws-opening', 'Kevin Ong', 'st-completed', 'Critical', '2026-08-30', '2026-08-28'],
  ['SOP-OPS-003', 'End-of-day closing & security', 'ws-opening', 'Aisha Rahman', 'st-pending-signoff', 'High', '2026-10-20', '2026-10-18'],
  ['SOP-OPS-004', 'Customer returns & refunds', 'ws-customer', 'Daniel Lim', 'st-in-progress', 'High', '2026-11-10', '2026-10-24'],
  ['SOP-OPS-005', 'Complaint handling & escalation', 'ws-customer', 'Grace Chua', 'st-pending-review', 'Medium', '2026-11-05', '2026-10-21'],
  ['SOP-OPS-006', 'Click & collect handover', 'ws-customer', 'Daniel Lim', 'st-not-started', 'Medium', '2026-12-01', '2026-09-30'],
  ['SOP-OPS-007', 'Planogram compliance audit', 'ws-visual', 'Priya Nair', 'st-in-progress', 'Medium', '2026-11-20', '2026-10-26'],
  ['SOP-OPS-008', 'Promotional display setup', 'ws-visual', 'Hannah Lee', 'st-on-hold', 'Low', '2026-12-15', '2026-10-02'],
  ['SOP-SC-001', 'Automated replenishment review', 'ws-replen', 'Marcus Tan', 'st-completed', 'Critical', '2026-09-15', '2026-09-14'],
  ['SOP-SC-002', 'Manual emergency ordering', 'ws-replen', 'Marcus Tan', 'st-in-progress', 'High', '2026-10-25', '2026-10-22'],
  ['SOP-SC-003', 'Stock count & cycle counting', 'ws-replen', 'Ravi Kumar', 'st-pending-review', 'High', '2026-11-12', '2026-10-27'],
  ['SOP-SC-004', 'Inbound delivery inspection', 'ws-receiving', 'Sofia Alvarez', 'st-completed', 'High', '2026-09-30', '2026-09-29'],
  ['SOP-SC-005', 'Delivery discrepancy claims', 'ws-receiving', 'Sofia Alvarez', 'st-not-started', 'Medium', '2026-12-10', '2026-10-01'],
  ['SOP-SC-006', 'Damaged goods write-off', 'ws-receiving', 'Ravi Kumar', 'st-pending-signoff', 'Low', '2026-11-28', '2026-10-25'],
]

const sops: Sop[] = sopSeeds.map(([code, name, workstreamId, owner, statusId, priority, targetDate, updated], i) => ({
  id: `sop-${i + 1}`,
  code,
  name,
  workstreamId,
  owner,
  statusId,
  priority,
  targetDate,
  description: '',
  createdAt: created,
  updatedAt: `${updated}T10:00:00.000Z`,
}))

export function createSampleData(): AppData {
  return structuredClone({ version: 1, streams, workstreams, statuses: DEFAULT_STATUSES, sops })
}

export function createEmptyData(): AppData {
  return { version: 1, streams: [], workstreams: [], statuses: structuredClone(DEFAULT_STATUSES), sops: [] }
}
