'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/page-header'
import { OptionSelect } from '@/components/shared/option-select'
import { useCommit, useData } from '@/components/data-provider'
import { addSop, updateSop, validateSop, type SopFieldErrors, type SopInput } from '@/lib/actions'
import { sortedStatuses } from '@/lib/metrics'
import { PRIORITIES, type Priority, type Sop } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sop?: Sop | null
}

export function SopFormDialog({ open, onOpenChange, sop }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <SopForm key={sop?.id ?? 'new'} sop={sop} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function suggestCode(existing: string[]) {
  let max = 0
  for (const code of existing) {
    const m = /^SOP-(\d+)$/i.exec(code)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `SOP-${String(max + 1).padStart(3, '0')}`
}

function SopForm({ sop, onDone }: { sop?: Sop | null; onDone: () => void }) {
  const data = useData()
  const commit = useCommit()
  const statuses = useMemo(() => sortedStatuses(data), [data])
  const initialWs = sop ? data.workstreams.find((w) => w.id === sop.workstreamId) : undefined

  const [streamId, setStreamId] = useState(initialWs?.streamId ?? '')
  const [form, setForm] = useState<SopInput>(() => ({
    code: sop?.code ?? suggestCode(data.sops.map((s) => s.code)),
    name: sop?.name ?? '',
    workstreamId: sop?.workstreamId ?? '',
    owner: sop?.owner ?? '',
    statusId: sop?.statusId ?? statuses.find((s) => s.active)?.id ?? '',
    priority: sop?.priority ?? 'Medium',
    targetDate: sop?.targetDate ?? '',
    description: sop?.description ?? '',
  }))
  const [errors, setErrors] = useState<SopFieldErrors>({})

  const workstreamOptions = data.workstreams.filter((w) => w.streamId === streamId).map((w) => ({ value: w.id, label: w.name }))
  // Inactive statuses stay selectable only for the SOP currently using them.
  const statusOptions = statuses
    .filter((s) => s.active || s.id === sop?.statusId)
    .map((s) => ({ value: s.id, label: s.active ? s.name : `${s.name} (inactive)` }))

  function set<K extends keyof SopInput>(key: K, value: SopInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next = validateSop(data, form, sop?.id)
    if (!streamId) next.streamId = 'Select a stream.'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    const success = commit((d) => (sop ? updateSop(d, sop.id, form) : addSop(d, form)))
    if (success) onDone()
  }

  const err = (k: keyof SopFieldErrors) => ({
    invalid: !!errors[k],
    describedBy: errors[k] ? `sop-${k}-error` : undefined,
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>{sop ? `Edit ${sop.code}` : 'Add SOP'}</DialogTitle>
        <DialogDescription>Fields marked with * are required. Select a stream to see its workstreams.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SOP ID" htmlFor="sop-code" required error={errors.code} k="code">
          <Input
            id="sop-code"
            value={form.code}
            maxLength={30}
            className="font-mono uppercase"
            aria-invalid={err('code').invalid || undefined}
            aria-describedby={err('code').describedBy}
            onChange={(e) => set('code', e.target.value)}
          />
        </Field>
        <Field label="Priority" htmlFor="sop-priority" required error={errors.priority} k="priority">
          <OptionSelect id="sop-priority" value={form.priority} onChange={(v) => set('priority', v as Priority)} options={PRIORITIES.map((p) => ({ value: p, label: p }))} invalid={err('priority').invalid} />
        </Field>
        <Field label="SOP name" htmlFor="sop-name" required error={errors.name} k="name" className="sm:col-span-2">
          <Input
            id="sop-name"
            value={form.name}
            maxLength={140}
            aria-invalid={err('name').invalid || undefined}
            aria-describedby={err('name').describedBy}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Customer returns & refunds"
          />
        </Field>
        <Field label="Stream" htmlFor="sop-stream" required error={errors.streamId} k="streamId">
          <OptionSelect
            id="sop-stream"
            value={streamId}
            onChange={(v) => {
              setStreamId(v)
              setErrors((e) => ({ ...e, streamId: undefined }))
              if (v !== streamId) set('workstreamId', '')
            }}
            options={data.streams.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select a stream"
            invalid={err('streamId').invalid}
          />
        </Field>
        <Field label="Workstream" htmlFor="sop-ws" required error={errors.workstreamId} k="workstreamId">
          <OptionSelect
            id="sop-ws"
            value={form.workstreamId}
            onChange={(v) => set('workstreamId', v)}
            options={workstreamOptions}
            placeholder={!streamId ? 'Select a stream first' : workstreamOptions.length ? 'Select a workstream' : 'No workstreams in this stream'}
            disabled={!streamId || workstreamOptions.length === 0}
            invalid={err('workstreamId').invalid}
          />
        </Field>
        <Field label="PIC / Owner" htmlFor="sop-owner" required error={errors.owner} k="owner">
          <Input
            id="sop-owner"
            value={form.owner}
            maxLength={80}
            autoComplete="name"
            aria-invalid={err('owner').invalid || undefined}
            aria-describedby={err('owner').describedBy}
            onChange={(e) => set('owner', e.target.value)}
            placeholder="Person in charge"
          />
        </Field>
        <Field label="Status" htmlFor="sop-status" required error={errors.statusId} k="statusId">
          <OptionSelect id="sop-status" value={form.statusId} onChange={(v) => set('statusId', v)} options={statusOptions} invalid={err('statusId').invalid} />
        </Field>
        <Field label="Target date" htmlFor="sop-date" required error={errors.targetDate} k="targetDate">
          <Input
            id="sop-date"
            type="date"
            value={form.targetDate}
            aria-invalid={err('targetDate').invalid || undefined}
            aria-describedby={err('targetDate').describedBy}
            onChange={(e) => set('targetDate', e.target.value)}
          />
        </Field>
        <Field label="Description / Notes" htmlFor="sop-desc" k="description" className="sm:col-span-2">
          <Textarea id="sop-desc" value={form.description} maxLength={1000} rows={3} onChange={(e) => set('description', e.target.value)} placeholder="Optional" />
        </Field>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">{sop ? 'Save changes' : 'Create SOP'}</Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  required,
  error,
  k,
  className,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  k: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      <FieldError id={`sop-${k}-error`} message={error} />
    </div>
  )
}
