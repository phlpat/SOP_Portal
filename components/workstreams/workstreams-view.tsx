'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCommit, useData } from '@/components/data-provider'
import { EmptyState, PageHeader } from '@/components/shared/page-header'
import { ProgressBar } from '@/components/shared/badges'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { OptionSelect } from '@/components/shared/option-select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteWorkstream } from '@/lib/actions'
import { getWorkstreamStats, rate } from '@/lib/metrics'
import type { Workstream } from '@/lib/types'
import { WorkstreamFormDialog } from './workstream-form-dialog'

const ALL = 'all'

export function WorkstreamsView() {
  const data = useData()
  const commit = useCommit()
  const stats = useMemo(() => getWorkstreamStats(data), [data])
  const streamNames = useMemo(() => new Map(data.streams.map((s) => [s.id, s.name])), [data.streams])

  const [streamFilter, setStreamFilter] = useState(ALL)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Workstream | null>(null)
  const [deleting, setDeleting] = useState<Workstream | null>(null)

  const effectiveFilter = streamFilter !== ALL && !streamNames.has(streamFilter) ? ALL : streamFilter
  const q = query.trim().toLowerCase()
  const searching = q !== ''

  // One group per stream, in stream order, holding only the workstreams that match the filters.
  const groups = useMemo(
    () =>
      data.streams
        .filter((s) => effectiveFilter === ALL || s.id === effectiveFilter)
        .map((stream) => ({
          stream,
          rows: data.workstreams.filter(
            (w) => w.streamId === stream.id && (!q || w.name.toLowerCase().includes(q) || w.lead.toLowerCase().includes(q)),
          ),
        }))
        // While searching, hide streams with no hits so the results are easy to scan.
        .filter((g) => !searching || g.rows.length > 0),
    [data.streams, data.workstreams, effectiveFilter, q, searching],
  )

  const deletingCount = deleting ? (stats.get(deleting.id)?.sopCount ?? 0) : 0
  // Matching results are always shown open so a search never hides what it found.
  const isOpen = (id: string) => searching || !collapsed.has(id)
  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.stream.id))

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <>
      <PageHeader
        title="Workstream Management"
        description="Organise workstreams under their parent streams."
        actions={
          <Button
            disabled={data.streams.length === 0}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Add Workstream
          </Button>
        }
      />

      {data.streams.length === 0 ? (
        <EmptyState title="Create a stream first" description="Workstreams must belong to a stream. Head to Stream Management to add one." />
      ) : (
        <>
          <Card className="gap-0 py-0">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search workstreams or leads" className="pl-8" aria-label="Search workstreams" />
              </div>
              <OptionSelect
                className="sm:w-60"
                aria-label="Filter by stream"
                value={effectiveFilter}
                onChange={(v) => setStreamFilter(v || ALL)}
                options={[{ value: ALL, label: 'All streams' }, ...data.streams.map((s) => ({ value: s.id, label: s.name }))]}
              />
              <Button
                variant="outline"
                disabled={searching || groups.length < 2}
                onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.stream.id)))}
              >
                {allCollapsed ? <ChevronsUpDown data-icon="inline-start" /> : <ChevronsDownUp data-icon="inline-start" />}
                {allCollapsed ? 'Expand all' : 'Collapse all'}
              </Button>
            </CardContent>
          </Card>

          {groups.length === 0 && (
            <EmptyState title="No workstreams match your filters" description="Try a different search or choose another stream." />
          )}

          {groups.map(({ stream, rows }) => {
            const open = isOpen(stream.id)
            const done = rows.reduce((n, w) => n + (stats.get(w.id)?.completed ?? 0), 0)
            const total = rows.reduce((n, w) => n + (stats.get(w.id)?.sopCount ?? 0), 0)
            const panelId = `ws-group-${stream.id}`
            return (
              <Card key={stream.id} className="gap-0 py-0">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(stream.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {open ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{stream.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {rows.length} workstream{rows.length === 1 ? '' : 's'} · {done}/{total} SOPs · {rate(done, total)}%
                  </span>
                </button>

                {open && (
                  <div id={panelId} className="border-t">
                    {rows.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">No workstreams in this stream yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-4">Workstream</TableHead>
                            <TableHead className="hidden md:table-cell">Lead</TableHead>
                            <TableHead className="text-right">SOPs</TableHead>
                            <TableHead className="hidden w-48 lg:table-cell">Completion</TableHead>
                            <TableHead className="w-24 pr-4 text-right">
                              <span className="sr-only">Actions</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((w) => {
                            const s = stats.get(w.id)!
                            return (
                              <TableRow key={w.id}>
                                <TableCell className="pl-4">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{w.name}</span>
                                    {w.description && <span className="max-w-72 truncate text-xs text-muted-foreground">{w.description}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden text-muted-foreground md:table-cell">{w.lead || '—'}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {s.completed}/{s.sopCount}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex items-center gap-2">
                                    <ProgressBar value={s.completionRate} label={`${w.name} completion`} />
                                    <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{s.completionRate}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="pr-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Edit ${w.name}`}
                                      onClick={() => {
                                        setEditing(w)
                                        setFormOpen(true)
                                      }}
                                    >
                                      <Pencil />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${w.name}`} onClick={() => setDeleting(w)}>
                                      <Trash2 className="text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </>
      )}

      <WorkstreamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        workstream={editing}
        defaultStreamId={effectiveFilter !== ALL ? effectiveFilter : undefined}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        confirmLabel="Delete workstream"
        description={
          deletingCount > 0 ? (
            <p>
              <strong className="text-destructive">Warning:</strong> {deletingCount} SOP{deletingCount === 1 ? '' : 's'} linked to this workstream
              will also be permanently deleted.
            </p>
          ) : (
            <p>This workstream has no SOPs. It will be permanently removed.</p>
          )
        }
        onConfirm={() => deleting && commit((d) => deleteWorkstream(d, deleting.id))}
      />
    </>
  )
}
