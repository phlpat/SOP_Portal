'use client'

import { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/page-header'
import { OptionSelect } from '@/components/shared/option-select'
import { useCommit, useData } from '@/components/data-provider'
import { addWorkstream, updateWorkstream } from '@/lib/actions'
import type { ID, Workstream } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workstream?: Workstream | null
  defaultStreamId?: ID
}

export function WorkstreamFormDialog({ open, onOpenChange, workstream, defaultStreamId }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <WorkstreamForm key={workstream?.id ?? 'new'} workstream={workstream} defaultStreamId={defaultStreamId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function WorkstreamForm({ workstream, defaultStreamId, onDone }: { workstream?: Workstream | null; defaultStreamId?: ID; onDone: () => void }) {
  const data = useData()
  const commit = useCommit()
  const [streamId, setStreamId] = useState(workstream?.streamId ?? defaultStreamId ?? data.streams[0]?.id ?? '')
  const [name, setName] = useState(workstream?.name ?? '')
  const [lead, setLead] = useState(workstream?.lead ?? '')
  const [description, setDescription] = useState(workstream?.description ?? '')
  const [errors, setErrors] = useState<{ streamId?: string; name?: string }>({})

  const sopCount = workstream ? data.sops.filter((s) => s.workstreamId === workstream.id).length : 0
  const movingStream = workstream && streamId !== workstream.streamId && sopCount > 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!streamId) next.streamId = 'Select a stream.'
    if (!name.trim()) next.name = 'Workstream name is required.'
    setErrors(next)
    if (Object.keys(next).length) return
    const input = { streamId, name, lead, description }
    const success = commit((d) => (workstream ? updateWorkstream(d, workstream.id, input) : addWorkstream(d, input)))
    if (success) onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{workstream ? 'Edit Workstream' : 'Add Workstream'}</DialogTitle>
        <DialogDescription>Every workstream belongs to exactly one stream.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-stream">
          Stream <span className="text-destructive">*</span>
        </Label>
        <OptionSelect
          id="ws-stream"
          value={streamId}
          onChange={(v) => {
            setStreamId(v)
            setErrors((e) => ({ ...e, streamId: undefined }))
          }}
          options={data.streams.map((s) => ({ value: s.id, label: s.name }))}
          placeholder={data.streams.length ? 'Select a stream' : 'Create a stream first'}
          disabled={data.streams.length === 0}
          invalid={!!errors.streamId}
        />
        <FieldError id="ws-stream-error" message={errors.streamId} />
        {movingStream && (
          <p className="text-xs text-amber-700">
            {sopCount} SOP{sopCount === 1 ? '' : 's'} will move with this workstream to the new stream.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-name">
          Workstream name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ws-name"
          value={name}
          maxLength={80}
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? 'ws-name-error' : undefined}
          onChange={(e) => {
            setName(e.target.value)
            setErrors((er) => ({ ...er, name: undefined }))
          }}
          placeholder="e.g. Customer Service"
        />
        <FieldError id="ws-name-error" message={errors.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-lead">Workstream lead</Label>
        <Input id="ws-lead" value={lead} maxLength={80} onChange={(e) => setLead(e.target.value)} placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-description">Description</Label>
        <Textarea id="ws-description" value={description} maxLength={400} rows={3} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={data.streams.length === 0}>
          {workstream ? 'Save changes' : 'Create workstream'}
        </Button>
      </DialogFooter>
    </form>
  )
}
