'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface OptionSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  'aria-label'?: string
}

export function OptionSelect({ id, value, onChange, options, placeholder = 'Select…', disabled, invalid, className, ...rest }: OptionSelectProps) {
  const selected = options.find((o) => o.value === value)
  return (
    <Select value={value || null} onValueChange={(v) => onChange((v as string | null) ?? '')} disabled={disabled}>
      <SelectTrigger id={id} className={cn('w-full', className)} aria-invalid={invalid || undefined} aria-label={rest['aria-label']}>
        <SelectValue>
          {() => (selected ? <span className="truncate">{selected.label}</span> : <span className="text-muted-foreground">{placeholder}</span>)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
