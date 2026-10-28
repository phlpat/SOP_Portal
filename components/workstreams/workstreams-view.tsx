'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
import { getWorkstreamStats } from '@/lib/metrics'
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
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Workstream | null>(null)
  const [deleting, setDeleting] = useState<Workstream | null>(null)

  const effectiveFilter = streamFilter !== ALL && !streamNames.has(streamFilter) ? ALL : streamFilter
  const q = query.trim().toLowerCase()
  const rows = data.workstreams.filter(
    (w) =>
      (effectiveFilter === ALL || w.streamId === effectiveFilter) &&
      (!q || w.name.toLowerCase().includes(q) || w.lead.toLowerCase().includes(q)),
  )
  const deletingCount = deleting ? (stats.get(deleting.id)?.sopCount ?? 0) : 0

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
        <Card className="gap-0 py-0">
          <CardContent className="flex flex-col gap-3 border-b p-4 sm:flex-row">
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
          </CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Workstream</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead className="hidden md:table-cell">Lead</TableHead>
                <TableHead className="text-right">SOPs</TableHead>
                <TableHead className="hidden w-48 lg:table-cell">Completion</TableHead>
                <TableHead className="w-24 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No workstreams match your filters.
                  </TableCell>
                </TableRow>
              )}
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
                    <TableCell className="text-muted-foreground">{streamNames.get(w.streamId)}</TableCell>
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
        </Card>
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
