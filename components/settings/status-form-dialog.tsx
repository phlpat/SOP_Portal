'use client'

import { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FieldError } from '@/components/shared/page-header'
import { OptionSelect } from '@/components/shared/option-select'
import { useCommit } from '@/components/data-provider'
import { addStatus, updateStatus, type StatusInput } from '@/lib/actions'
import { STATUS_COLOR_STYLES } from '@/lib/colors'
import { STATUS_CATEGORIES, STATUS_COLORS, type Status, type StatusCategory } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  status?: Status | null
}

export function StatusFormDialog({ open, onOpenChange, status }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <StatusForm key={status?.id ?? 'new'} status={status} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function StatusForm({ status, onDone }: { status?: Status | null; onDone: () => void }) {
  const commit = useCommit()
  const [form, setForm] = useState<StatusInput>({
    name: status?.name ?? '',
    color: status?.color ?? 'blue',
    category: status?.category ?? 'in_progress',
    countsAsComplete: status?.countsAsComplete ?? false,
  })
  const [error, setError] = useState<string>()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Status name is required.')
    const success = commit((d) => (status ? updateStatus(d, status.id, form) : addStatus(d, form)))
    if (success) onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{status ? 'Edit Status' : 'Add Status'}</DialogTitle>
        <DialogDescription>Statuses are available in SOP forms, filters and dashboard charts.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="status-name">
          Status name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="status-name"
          value={form.name}
          maxLength={40}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'status-name-error' : undefined}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }))
            setError(undefined)
          }}
          placeholder="e.g. Under Legal Review"
        />
        <FieldError id="status-name-error" message={error} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {STATUS_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="status-color" value={c} checked={form.color === c} onChange={() => setForm((f) => ({ ...f, color: c }))} className="peer sr-only" />
              <span
                className={`flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${STATUS_COLOR_STYLES[c].dot}`}
              >
                <span className="sr-only">{STATUS_COLOR_STYLES[c].label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="status-complete">Counts as completed</Label>
          <p className="text-xs text-muted-foreground">SOPs in this status count toward completion rates.</p>
        </div>
        <Switch id="status-complete" checked={form.countsAsComplete} onCheckedChange={(v) => setForm((f) => ({ ...f, countsAsComplete: v }))} />
      </div>
      {!form.countsAsComplete && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="status-category">Reporting category</Label>
          <OptionSelect
            id="status-category"
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v as StatusCategory }))}
            options={STATUS_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <p className="text-xs text-muted-foreground">Determines which dashboard total (In Progress, Pending, etc.) this status rolls up to.</p>
        </div>
      )}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">{status ? 'Save changes' : 'Create status'}</Button>
      </DialogFooter>
    </form>
  )
}
