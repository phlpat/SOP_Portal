'use server'

import { neon } from '@neondatabase/serverless'
import { parseChanges, type DataChanges } from './changes'
import type { AppData } from './types'

let client: ReturnType<typeof neon> | null = null

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.')
  return (client ??= neon(url))
}

export async function loadData(): Promise<AppData> {
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
export async function saveChanges(input: DataChanges): Promise<void> {
  const changes = parseChanges(input)
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
