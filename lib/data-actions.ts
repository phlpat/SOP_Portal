'use server'

import { neon } from '@neondatabase/serverless'
import { parseChanges, type DataChanges } from './changes'
import type { AppData } from './types'

let client: ReturnType<typeof neon> | null = null

/**
 * Server Actions that throw have their message replaced by a digest in production, which
 * hides the cause from the screen. So these return a result and describe the failure in
 * words that are safe to show (never the connection string); the full error goes to the logs.
 */
export type ActionOutcome<T = void> = { ok: true; data: T } | { ok: false; error: string }

class SafeError extends Error {}

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new SafeError('DATABASE_URL is not set for this environment. Add it in Vercel → Settings → Environment Variables.')
  return (client ??= neon(url))
}

function describeError(error: unknown): string {
  if (error instanceof SafeError) return error.message
  const code = (error as { code?: string } | null)?.code
  if (code === '42P01') return 'Database tables are missing. Run db/schema.sql in the Neon SQL Editor for this database.'
  if (code === '23503') return 'Another user changed a related item. The latest data has been reloaded.'
  if (code === '28P01' || code === '28000') return 'Database login was rejected. Check DATABASE_URL.'
  if (error instanceof TypeError || /fetch failed|timeout|ENOTFOUND|ECONN/i.test(String((error as Error)?.message))) {
    return 'Could not reach the database.'
  }
  return 'Database error. See the server logs for details.'
}

async function guarded<T>(label: string, run: () => Promise<T>): Promise<ActionOutcome<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (error) {
    console.error(`[data-actions] ${label} failed:`, error)
    return { ok: false, error: describeError(error) }
  }
}

export async function loadData(): Promise<ActionOutcome<AppData>> {
  return guarded('loadData', fetchAll)
}

async function fetchAll(): Promise<AppData> {
  const sql = getSql()
  const [streams, workstreams, statuses, sops] = await sql.transaction([
    sql`select id, name, description, created_at as "createdAt" from streams order by position, created_at, id`,
    sql`select id, stream_id as "streamId", name, description, lead, created_at as "createdAt" from workstreams order by seq`,
    sql`select id, name, color, "order", active, category, counts_as_complete as "countsAsComplete" from statuses order by "order", id`,
    sql`select id, code, name, workstream_id as "workstreamId", owner, status_id as "statusId", priority,
               target_date as "targetDate", description, created_at as "createdAt", updated_at as "updatedAt"
        from sops order by seq`,
  ])
  return { version: 1, streams, workstreams, statuses, sops } as unknown as AppData
}

/** Applies a row-level diff atomically: either every change lands or none does. */
export async function saveChanges(input: DataChanges): Promise<ActionOutcome> {
  let changes: DataChanges
  try {
    changes = parseChanges(input)
  } catch (error) {
    // parseChanges only throws short messages about the shape of the request, safe to show.
    return { ok: false, error: error instanceof Error ? error.message : 'Invalid changes.' }
  }
  return guarded('saveChanges', () => applyChanges(changes))
}

async function applyChanges(changes: DataChanges): Promise<void> {
  const sql = getSql()
  const queries = []

  // Upserts go parent-first so foreign keys resolve; deletes go child-first.
  if (changes.streams.upsert.length) {
    queries.push(sql`
      insert into streams (id, name, description, created_at, position)
      select r.id, r.name, r.description, r."createdAt",
             coalesce((select max(position) from streams), -1) + row_number() over ()
      from jsonb_to_recordset(${JSON.stringify(changes.streams.upsert)}::jsonb)
           as r(id text, name text, description text, "createdAt" text)
      on conflict (id) do update set name = excluded.name, description = excluded.description`)
  }
  if (changes.statuses.upsert.length) {
    queries.push(sql`
      insert into statuses (id, name, color, "order", active, category, counts_as_complete)
      select r.id, r.name, r.color, r."order", r.active, r.category, r."countsAsComplete"
      from jsonb_to_recordset(${JSON.stringify(changes.statuses.upsert)}::jsonb)
           as r(id text, name text, color text, "order" integer, active boolean, category text, "countsAsComplete" boolean)
      on conflict (id) do update set name = excluded.name, color = excluded.color, "order" = excluded."order",
        active = excluded.active, category = excluded.category, counts_as_complete = excluded.counts_as_complete`)
  }
  if (changes.workstreams.upsert.length) {
    queries.push(sql`
      insert into workstreams (id, stream_id, name, description, lead, created_at)
      select r.id, r."streamId", r.name, r.description, r.lead, r."createdAt"
      from jsonb_to_recordset(${JSON.stringify(changes.workstreams.upsert)}::jsonb)
           as r(id text, "streamId" text, name text, description text, lead text, "createdAt" text)
      on conflict (id) do update set stream_id = excluded.stream_id, name = excluded.name,
        description = excluded.description, lead = excluded.lead`)
  }
  if (changes.sops.upsert.length) {
    queries.push(sql`
      insert into sops (id, code, name, workstream_id, owner, status_id, priority, target_date, description, created_at, updated_at)
      select r.id, r.code, r.name, r."workstreamId", r.owner, r."statusId", r.priority, r."targetDate", r.description, r."createdAt", r."updatedAt"
      from jsonb_to_recordset(${JSON.stringify(changes.sops.upsert)}::jsonb)
           as r(id text, code text, name text, "workstreamId" text, owner text, "statusId" text, priority text,
                "targetDate" text, description text, "createdAt" text, "updatedAt" text)
      on conflict (id) do update set code = excluded.code, name = excluded.name, workstream_id = excluded.workstream_id,
        owner = excluded.owner, status_id = excluded.status_id, priority = excluded.priority,
        target_date = excluded.target_date, description = excluded.description, updated_at = excluded.updated_at`)
  }
  if (changes.streamOrder?.length) {
    queries.push(sql`
      update streams s set position = o.pos::integer
      from (select value as id, ordinality - 1 as pos
            from jsonb_array_elements_text(${JSON.stringify(changes.streamOrder)}::jsonb) with ordinality) o
      where s.id = o.id`)
  }
  if (changes.sops.remove.length) queries.push(sql`delete from sops where id = any(${changes.sops.remove})`)
  if (changes.workstreams.remove.length) queries.push(sql`delete from workstreams where id = any(${changes.workstreams.remove})`)
  if (changes.streams.remove.length) queries.push(sql`delete from streams where id = any(${changes.streams.remove})`)
  if (changes.statuses.remove.length) queries.push(sql`delete from statuses where id = any(${changes.statuses.remove})`)

  if (queries.length) await sql.transaction(queries)
}
