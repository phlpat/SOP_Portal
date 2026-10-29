-- Sample data for the SOP Portal (generated from lib/sample-data.ts).
-- Run AFTER schema.sql. Safe to re-run: existing rows are left untouched.
-- Sample data only: do not put real company data here until IT/Security has
-- approved storing it on Neon.

insert into streams (id, name, description, created_at, position) values
  ('str-store-ops', 'Store Operations', 'Standardising in-store processes across the retail estate.', '2026-07-01T09:00:00.000Z', 0),
  ('str-supply-chain', 'Supply Chain & Inventory', 'Replenishment, distribution centre and stock accuracy procedures.', '2026-07-01T09:00:00.000Z', 1)
on conflict (id) do nothing;

insert into statuses (id, name, color, "order", active, category, counts_as_complete) values
  ('st-not-started', 'Not Started', 'slate', 0, true, 'not_started', false),
  ('st-in-progress', 'In Progress', 'blue', 1, true, 'in_progress', false),
  ('st-pending-review', 'Pending Review', 'amber', 2, true, 'pending', false),
  ('st-pending-signoff', 'Pending Sign-off', 'violet', 3, true, 'pending', false),
  ('st-completed', 'Completed', 'emerald', 4, true, 'in_progress', true),
  ('st-on-hold', 'On Hold', 'rose', 5, true, 'on_hold', false)
on conflict (id) do nothing;

insert into workstreams (id, stream_id, name, description, lead, created_at) values
  ('ws-opening', 'str-store-ops', 'Store Opening & Closing', 'Daily open/close routines and cash handling.', 'Aisha Rahman', '2026-07-01T09:00:00.000Z'),
  ('ws-customer', 'str-store-ops', 'Customer Service', 'Returns, complaints and service recovery.', 'Daniel Lim', '2026-07-01T09:00:00.000Z'),
  ('ws-visual', 'str-store-ops', 'Visual Merchandising', 'Planogram compliance and promotional setups.', 'Priya Nair', '2026-07-01T09:00:00.000Z'),
  ('ws-replen', 'str-supply-chain', 'Replenishment', 'Auto-replenishment and manual ordering.', 'Marcus Tan', '2026-07-01T09:00:00.000Z'),
  ('ws-receiving', 'str-supply-chain', 'Goods Receiving', 'Inbound deliveries, checks and discrepancies.', 'Sofia Alvarez', '2026-07-01T09:00:00.000Z')
on conflict (id) do nothing;

insert into sops (id, code, name, workstream_id, owner, status_id, priority, target_date, description, created_at, updated_at) values
  ('sop-1', 'SOP-OPS-001', 'Store opening checklist', 'ws-opening', 'Aisha Rahman', 'st-completed', 'High', '2026-08-15', '', '2026-07-01T09:00:00.000Z', '2026-08-12T10:00:00.000Z'),
  ('sop-2', 'SOP-OPS-002', 'Cash float & till reconciliation', 'ws-opening', 'Kevin Ong', 'st-completed', 'Critical', '2026-08-30', '', '2026-07-01T09:00:00.000Z', '2026-08-28T10:00:00.000Z'),
  ('sop-3', 'SOP-OPS-003', 'End-of-day closing & security', 'ws-opening', 'Aisha Rahman', 'st-pending-signoff', 'High', '2026-10-20', '', '2026-07-01T09:00:00.000Z', '2026-10-18T10:00:00.000Z'),
  ('sop-4', 'SOP-OPS-004', 'Customer returns & refunds', 'ws-customer', 'Daniel Lim', 'st-in-progress', 'High', '2026-11-10', '', '2026-07-01T09:00:00.000Z', '2026-10-24T10:00:00.000Z'),
  ('sop-5', 'SOP-OPS-005', 'Complaint handling & escalation', 'ws-customer', 'Grace Chua', 'st-pending-review', 'Medium', '2026-11-05', '', '2026-07-01T09:00:00.000Z', '2026-10-21T10:00:00.000Z'),
  ('sop-6', 'SOP-OPS-006', 'Click & collect handover', 'ws-customer', 'Daniel Lim', 'st-not-started', 'Medium', '2026-12-01', '', '2026-07-01T09:00:00.000Z', '2026-09-30T10:00:00.000Z'),
  ('sop-7', 'SOP-OPS-007', 'Planogram compliance audit', 'ws-visual', 'Priya Nair', 'st-in-progress', 'Medium', '2026-11-20', '', '2026-07-01T09:00:00.000Z', '2026-10-26T10:00:00.000Z'),
  ('sop-8', 'SOP-OPS-008', 'Promotional display setup', 'ws-visual', 'Hannah Lee', 'st-on-hold', 'Low', '2026-12-15', '', '2026-07-01T09:00:00.000Z', '2026-10-02T10:00:00.000Z'),
  ('sop-9', 'SOP-SC-001', 'Automated replenishment review', 'ws-replen', 'Marcus Tan', 'st-completed', 'Critical', '2026-09-15', '', '2026-07-01T09:00:00.000Z', '2026-09-14T10:00:00.000Z'),
  ('sop-10', 'SOP-SC-002', 'Manual emergency ordering', 'ws-replen', 'Marcus Tan', 'st-in-progress', 'High', '2026-10-25', '', '2026-07-01T09:00:00.000Z', '2026-10-22T10:00:00.000Z'),
  ('sop-11', 'SOP-SC-003', 'Stock count & cycle counting', 'ws-replen', 'Ravi Kumar', 'st-pending-review', 'High', '2026-11-12', '', '2026-07-01T09:00:00.000Z', '2026-10-27T10:00:00.000Z'),
  ('sop-12', 'SOP-SC-004', 'Inbound delivery inspection', 'ws-receiving', 'Sofia Alvarez', 'st-completed', 'High', '2026-09-30', '', '2026-07-01T09:00:00.000Z', '2026-09-29T10:00:00.000Z'),
  ('sop-13', 'SOP-SC-005', 'Delivery discrepancy claims', 'ws-receiving', 'Sofia Alvarez', 'st-not-started', 'Medium', '2026-12-10', '', '2026-07-01T09:00:00.000Z', '2026-10-01T10:00:00.000Z'),
  ('sop-14', 'SOP-SC-006', 'Damaged goods write-off', 'ws-receiving', 'Ravi Kumar', 'st-pending-signoff', 'Low', '2026-11-28', '', '2026-07-01T09:00:00.000Z', '2026-10-25T10:00:00.000Z')
on conflict (id) do nothing;
