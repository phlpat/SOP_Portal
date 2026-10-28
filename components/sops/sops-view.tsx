'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useCommit, useData } from '@/components/data-provider'
import { EmptyState, PageHeader } from '@/components/shared/page-header'
import { PriorityBadge, StatusBadge } from '@/components/shared/badges'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { OptionSelect } from '@/components/shared/option-select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteSop } from '@/lib/actions'
import { buildSopRows, formatDate, sortedStatuses, toDateInput, type SopRow } from '@/lib/metrics'
import { downloadFile, sopsToCsv } from '@/lib/export'
import { PRIORITIES, type Sop } from '@/lib/types'
import { SopFormDialog } from './sop-form-dialog'

const ALL = 'all'
const PAGE_SIZE = 10
const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p, i]))

type SortKey = 'code' | 'name' | 'stream' | 'workstream' | 'owner' | 'status' | 'priority' | 'targetDate' | 'updatedAt'

const sortValue: Record<SortKey, (r: SopRow) => string | number> = {
  code: (r) => r.code,
  name: (r) => r.name.toLowerCase(),
  stream: (r) => r.stream?.name.toLowerCase() ?? '',
  workstream: (r) => r.workstream?.name.toLowerCase() ?? '',
  owner: (r) => r.owner.toLowerCase(),
  status: (r) => r.status?.order ?? 999,
  priority: (r) => PRIORITY_RANK[r.priority] ?? 99,
  targetDate: (r) => r.targetDate,
  updatedAt: (r) => r.updatedAt,
}

export function SopsView({ openNew = false }: { openNew?: boolean }) {
  const data = useData()
  const commit = useCommit()
  const router = useRouter()
  const statuses = useMemo(() => sortedStatuses(data), [data])
  const allRows = useMemo(() => buildSopRows(data), [data])

  const [query, setQuery] = useState('')
  const [streamF, setStreamF] = useState(ALL)
  const [wsF, setWsF] = useState(ALL)
  const [statusF, setStatusF] = useState(ALL)
  const [priorityF, setPriorityF] = useState(ALL)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'targetDate', dir: 1 })
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(openNew)
  const [editing, setEditing] = useState<Sop | null>(null)
  const [deleting, setDeleting] = useState<Sop | null>(null)

  const exists = (id: string, list: { id: string }[]) => id === ALL || list.some((x) => x.id === id)
  const stream = exists(streamF, data.streams) ? streamF : ALL
  const wsList = data.workstreams.filter((w) => stream === ALL || w.streamId === stream)
  const ws = exists(wsF, wsList) ? wsF : ALL
  const status = exists(statusF, data.statuses) ? statusF : ALL

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = allRows.filter(
      (r) =>
        (stream === ALL || r.stream?.id === stream) &&
        (ws === ALL || r.workstreamId === ws) &&
        (status === ALL || r.statusId === status) &&
        (priorityF === ALL || r.priority === priorityF) &&
        (!q || [r.code, r.name, r.owner, r.stream?.name, r.workstream?.name].some((v) => v?.toLowerCase().includes(q))),
    )
    const get = sortValue[sort.key]
    return out.sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir || a.code.localeCompare(b.code)
    })
  }, [allRows, query, stream, ws, status, priorityF, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const today = toDateInput(new Date())
  const hasFilters = query || stream !== ALL || ws !== ALL || status !== ALL || priorityF !== ALL

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))
  }

  function openForm(sop: Sop | null) {
    setEditing(sop)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open && openNew) router.replace('/sops')
  }

  function exportCsv() {
    downloadFile(`sops-${today}.csv`, sopsToCsv(filtered), 'text/csv;charset=utf-8')
  }

  const SortHead = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => {
    const active = sort.key === k
    const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
    return (
      <TableHead className={className} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          {children}
          <Icon className={`size-3 ${active ? 'text-foreground' : 'opacity-40'}`} aria-hidden="true" />
        </button>
      </TableHead>
    )
  }

  return (
    <>
      <PageHeader
        title="SOP Management"
        description="Create, track and update every Standard Operating Procedure in the program."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download data-icon="inline-start" />
              Export CSV
            </Button>
            <Button onClick={() => openForm(null)} disabled={data.workstreams.length === 0}>
              <Plus data-icon="inline-start" />
              Add SOP
            </Button>
          </>
        }
      />

      {data.workstreams.length === 0 ? (
        <EmptyState title="No workstreams yet" description="SOPs belong to a workstream. Create a stream and workstream before adding SOPs." />
      ) : (
        <Card className="gap-0 py-0">
          <CardContent className="flex flex-col gap-3 border-b p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input value={query} onChange={(e) => resetPage(setQuery)(e.target.value)} placeholder="Search by ID, name, owner, stream…" className="pl-8" aria-label="Search SOPs" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:flex">
                <OptionSelect
                  className="lg:w-44"
                  aria-label="Filter by stream"
                  value={stream}
                  onChange={(v) => {
                    resetPage(setStreamF)(v || ALL)
                    setWsF(ALL)
                  }}
                  options={[{ value: ALL, label: 'All streams' }, ...data.streams.map((s) => ({ value: s.id, label: s.name }))]}
                />
                <OptionSelect
                  className="lg:w-44"
                  aria-label="Filter by workstream"
                  value={ws}
                  onChange={(v) => resetPage(setWsF)(v || ALL)}
                  options={[{ value: ALL, label: 'All workstreams' }, ...wsList.map((w) => ({ value: w.id, label: w.name }))]}
                />
                <OptionSelect
                  className="lg:w-40"
                  aria-label="Filter by status"
                  value={status}
                  onChange={(v) => resetPage(setStatusF)(v || ALL)}
                  options={[{ value: ALL, label: 'All statuses' }, ...statuses.map((s) => ({ value: s.id, label: s.active ? s.name : `${s.name} (inactive)` }))]}
                />
                <OptionSelect
                  className="lg:w-36"
                  aria-label="Filter by priority"
                  value={priorityF}
                  onChange={(v) => resetPage(setPriorityF)(v || ALL)}
                  options={[{ value: ALL, label: 'All priorities' }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span aria-live="polite">
                Showing {filtered.length} of {allRows.length} SOPs
              </span>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setStreamF(ALL)
                    setWsF(ALL)
                    setStatusF(ALL)
                    setPriorityF(ALL)
                    setPage(1)
                  }}
                >
                  <X data-icon="inline-start" />
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <SortHead k="code" className="pl-4">SOP ID</SortHead>
                <SortHead k="name">SOP Name</SortHead>
                <SortHead k="stream" className="hidden xl:table-cell">Stream</SortHead>
                <SortHead k="workstream" className="hidden lg:table-cell">Workstream</SortHead>
                <SortHead k="owner" className="hidden md:table-cell">PIC / Owner</SortHead>
                <SortHead k="status">Status</SortHead>
                <SortHead k="priority" className="hidden sm:table-cell">Priority</SortHead>
                <SortHead k="targetDate">Target Date</SortHead>
                <SortHead k="updatedAt" className="hidden 2xl:table-cell">Last Updated</SortHead>
                <TableHead className="w-24 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    {allRows.length === 0 ? 'No SOPs yet. Click “Add SOP” to create the first one.' : 'No SOPs match your filters.'}
                  </TableCell>
                </TableRow>
              )}
              {pageRows.map((r) => {
                const overdue = !r.status?.countsAsComplete && r.targetDate < today
                return (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4 font-mono text-xs">{r.code}</TableCell>
                    <TableCell>
                      <span className="block max-w-64 truncate font-medium" title={r.name}>
                        {r.name}
                      </span>
                      <span className="block max-w-64 truncate text-xs text-muted-foreground lg:hidden">{r.workstream?.name}</span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{r.stream?.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{r.workstream?.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{r.owner}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PriorityBadge priority={r.priority} />
                    </TableCell>
                    <TableCell className={`whitespace-nowrap tabular-nums ${overdue ? 'font-medium text-red-600' : ''}`}>
                      {formatDate(r.targetDate)}
                      {overdue && <span className="sr-only"> (overdue)</span>}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground 2xl:table-cell">{formatDate(r.updatedAt)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${r.code}`} onClick={() => openForm(r)}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${r.code}`} onClick={() => setDeleting(r)}>
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {pageCount > 1 && (
            <nav className="flex items-center justify-between border-t px-4 py-3 text-sm" aria-label="Pagination">
              <span className="text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                  <ChevronLeft data-icon="inline-start" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                  Next
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </nav>
          )}
        </Card>
      )}

      <SopFormDialog open={formOpen} onOpenChange={handleFormOpenChange} sop={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.code}?`}
        confirmLabel="Delete SOP"
        description={<p>&ldquo;{deleting?.name}&rdquo; will be permanently removed. This cannot be undone.</p>}
        onConfirm={() => deleting && commit((d) => deleteSop(d, deleting.id))}
      />
    </>
  )
}
