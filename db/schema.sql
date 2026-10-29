-- SOP Portal schema for Neon (Postgres).
-- Run once in the Neon SQL Editor. Safe to re-run: every statement is idempotent.
--
-- Ids are text (the app generates them), and timestamps/dates are stored as the
-- same ISO strings the app already uses, so rows round-trip without conversion.

create table if not exists streams (
  id          text primary key,
  name        text not null,
  description text not null default '',
  created_at  text not null,
  position    integer not null default 0   -- display order (drag to reorder)
);

create table if not exists workstreams (
  id          text primary key,
  seq         bigint generated always as identity,  -- insertion order
  stream_id   text not null references streams (id) on delete cascade,
  name        text not null,
  description text not null default '',
  lead        text not null default '',
  created_at  text not null
);
create index if not exists workstreams_stream_idx on workstreams (stream_id);

create table if not exists statuses (
  id                 text primary key,
  name               text not null,
  color              text not null,
  "order"            integer not null,
  active             boolean not null default true,
  category           text not null,
  counts_as_complete boolean not null default false
);

create table if not exists sops (
  id            text primary key,
  seq           bigint generated always as identity,  -- insertion order
  code          text not null,
  name          text not null,
  workstream_id text not null references workstreams (id) on delete cascade,
  owner         text not null default '',
  status_id     text not null references statuses (id),
  priority      text not null,
  target_date   text not null default '',
  description   text not null default '',
  created_at    text not null,
  updated_at    text not null
);
create index if not exists sops_workstream_idx on sops (workstream_id);
create index if not exists sops_status_idx on sops (status_id);
