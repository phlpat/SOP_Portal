'use client'

import { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/page-header'
import { useCommit } from '@/components/data-provider'
import { addStream, updateStream } from '@/lib/actions'
import type { Stream } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  stream?: Stream | null
}

export function StreamFormDialog({ open, onOpenChange, stream }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <StreamForm key={stream?.id ?? 'new'} stream={stream} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function StreamForm({ stream, onDone }: { stream?: Stream | null; onDone: () => void }) {
  const commit = useCommit()
  const [name, setName] = useState(stream?.name ?? '')
  const [description, setDescription] = useState(stream?.description ?? '')
  const [error, setError] = useState<string>()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Stream name is required.')
    const input = { name, description }
    const success = commit((d) => (stream ? updateStream(d, stream.id, input) : addStream(d, input)))
    if (success) onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{stream ? 'Edit Stream' : 'Add Stream'}</DialogTitle>
        <DialogDescription>Streams group related workstreams within the transformation program.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="stream-name">
          Stream name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="stream-name"
          value={name}
          maxLength={80}
          autoFocus
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'stream-name-error' : undefined}
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
          placeholder="e.g. Store Operations"
        />
        <FieldError id="stream-name-error" message={error} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="stream-description">Description</Label>
        <Textarea
          id="stream-description"
          value={description}
          maxLength={400}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional summary of the stream's scope"
          rows={3}
        />
      </div>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">{stream ? 'Save changes' : 'Create stream'}</Button>
      </DialogFooter>
    </form>
  )
}
