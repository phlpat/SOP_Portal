'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCommit, useData } from '@/components/data-provider'
import { PageHeader, EmptyState } from '@/components/shared/page-header'
import { ProgressBar } from '@/components/shared/badges'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { deleteStream, moveStream } from '@/lib/actions'
import { getStreamStats } from '@/lib/metrics'
import type { Stream } from '@/lib/types'
import { StreamFormDialog } from './stream-form-dialog'

export function StreamsView() {
  const data = useData()
  const commit = useCommit()
  const stats = useMemo(() => getStreamStats(data), [data])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Stream | null>(null)
  const [deleting, setDeleting] = useState<Stream | null>(null)

  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const deletingStats = deleting ? stats.get(deleting.id) : undefined

  function moveTo(id: string, index: number) {
    if (index < 0 || index >= data.streams.length || data.streams[index].id === id) return
    commit((d) => moveStream(d, id, index))
  }

  function endDrag() {
    setDragId(null)
    setOverId(null)
  }

  return (
    <>
      <PageHeader
        title="Stream Management"
        description="Create and maintain the program streams. Drag a card to change the order; it applies to the sidebar and dashboard too."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Add Stream
          </Button>
        }
      />

      {data.streams.length === 0 ? (
        <EmptyState
          title="No streams yet"
          description="Streams are the top level of your program structure. Add one to get started."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus data-icon="inline-start" />
              Add Stream
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.streams.map((stream, index) => {
            const s = stats.get(stream.id)!
            return (
              <Card
                key={stream.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', stream.id)
                  setDragId(stream.id)
                }}
                onDragOver={(e) => {
                  if (!dragId) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (overId !== stream.id) setOverId(stream.id)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragId) moveTo(dragId, index)
                  endDrag()
                }}
                onDragEnd={endDrag}
                className={`transition-opacity ${dragId === stream.id ? 'opacity-40' : ''} ${dragId && overId === stream.id && dragId !== stream.id ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5 text-base">
                    <GripVertical className="-ml-1 size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden="true" />
                    <span className="min-w-0 truncate">{stream.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10">{stream.description || 'No description provided.'}</CardDescription>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${stream.name}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(stream)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        {/* Keyboard and touch fallback for drag-and-drop. */}
                        <DropdownMenuItem disabled={index === 0} onClick={() => moveTo(stream.id, index - 1)}>
                          <ArrowUp />
                          Move earlier
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={index === data.streams.length - 1} onClick={() => moveTo(stream.id, index + 1)}>
                          <ArrowDown />
                          Move later
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(stream)}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <dl className="grid grid-cols-3 gap-2 rounded-md bg-muted/60 p-3 text-center">
                    <div>
                      <dt className="text-xs text-muted-foreground">Workstreams</dt>
                      <dd className="text-lg font-semibold tabular-nums">{s.workstreamCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">SOPs</dt>
                      <dd className="text-lg font-semibold tabular-nums">{s.sopCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Completed</dt>
                      <dd className="text-lg font-semibold tabular-nums">{s.completed}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Completion rate</span>
                      <span className="font-medium tabular-nums">{s.completionRate}%</span>
                    </div>
                    <ProgressBar value={s.completionRate} label={`${stream.name} completion`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <StreamFormDialog open={formOpen} onOpenChange={setFormOpen} stream={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        confirmLabel="Delete stream"
        description={
          deletingStats && (deletingStats.workstreamCount > 0 || deletingStats.sopCount > 0) ? (
            <p>
              <strong className="text-destructive">Warning:</strong> this stream contains {deletingStats.workstreamCount} workstream
              {deletingStats.workstreamCount === 1 ? '' : 's'} and {deletingStats.sopCount} SOP{deletingStats.sopCount === 1 ? '' : 's'}. They will
              all be permanently deleted. This cannot be undone.
            </p>
          ) : (
            <p>This stream is empty. It will be permanently removed.</p>
          )
        }
        onConfirm={() => deleting && commit((d) => deleteStream(d, deleting.id))}
      />
    </>
  )
}
