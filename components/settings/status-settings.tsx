'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCommit, useData } from '@/components/data-provider'
import { StatusBadge } from '@/components/shared/badges'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteStatus, moveStatus, setCompletionStatus, toggleStatusActive } from '@/lib/actions'
import { sortedStatuses } from '@/lib/metrics'
import { STATUS_CATEGORIES, type Status } from '@/lib/types'
import { StatusFormDialog } from './status-form-dialog'

const CATEGORY_LABEL = Object.fromEntries(STATUS_CATEGORIES.map((c) => [c.value, c.label]))

export function StatusSettings() {
  const data = useData()
  const commit = useCommit()
  const statuses = useMemo(() => sortedStatuses(data), [data])
  const usage = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of data.sops) m.set(s.statusId, (m.get(s.statusId) ?? 0) + 1)
    return m
  }, [data.sops])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Status | null>(null)
  const [deleting, setDeleting] = useState<Status | null>(null)

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b pb-6">
        <CardTitle>SOP Status Configuration</CardTitle>
        <CardDescription>Add, rename, reorder or deactivate statuses, and choose which ones count as completed on the dashboard.</CardDescription>
        <CardAction>
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Add Status
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 pl-6">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="text-right">SOPs</TableHead>
              <TableHead className="text-center">Counts as complete</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="w-24 pr-6 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((s, i) => {
              const count = usage.get(s.id) ?? 0
              return (
                <TableRow key={s.id} className={s.active ? undefined : 'opacity-60'}>
                  <TableCell className="pl-6">
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon-xs" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => commit((d) => moveStatus(d, s.id, -1))}>
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Move ${s.name} down`}
                        disabled={i === statuses.length - 1}
                        onClick={() => commit((d) => moveStatus(d, s.id, 1))}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{s.countsAsComplete ? 'Completed' : CATEGORY_LABEL[s.category]}</TableCell>
                  <TableCell className="text-right tabular-nums">{count}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={s.countsAsComplete}
                      aria-label={`${s.name} counts as completed`}
                      onCheckedChange={(v) => commit((d) => setCompletionStatus(d, s.id, v))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={s.active} aria-label={`${s.name} active`} onCheckedChange={() => commit((d) => toggleStatusActive(d, s.id))} />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${s.name}`}
                        onClick={() => {
                          setEditing(s)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <p className="border-t px-6 py-3 text-xs text-muted-foreground">
          Inactive statuses are hidden from new SOP forms but kept on existing SOPs and in reports. Statuses in use cannot be deleted — deactivate them instead.
        </p>
      </CardContent>

      <StatusFormDialog open={formOpen} onOpenChange={setFormOpen} status={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete status "${deleting?.name}"?`}
        confirmLabel="Delete status"
        description={
          deleting && (usage.get(deleting.id) ?? 0) > 0 ? (
            <p>
              This status is used by {usage.get(deleting.id)} SOP(s) and cannot be deleted. Deactivate it or reassign those SOPs first.
            </p>
          ) : (
            <p>This status is not used by any SOP and will be permanently removed.</p>
          )
        }
        onConfirm={() => deleting && commit((d) => deleteStatus(d, deleting.id))}
      />
    </Card>
  )
}
