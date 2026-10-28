import { cn } from '@/lib/utils'
import { PRIORITY_STYLES, STATUS_COLOR_STYLES } from '@/lib/colors'
import type { Priority, Status } from '@/lib/types'

export function StatusBadge({ status, className }: { status?: Status; className?: string }) {
  if (!status) {
    return <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-xs text-muted-foreground', className)}>Unknown</span>
  }
  const style = STATUS_COLOR_STYLES[status.color] ?? STATUS_COLOR_STYLES.slate
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium', style.badge, className)}>
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {status.name}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium', PRIORITY_STYLES[priority])}>
      {priority}
    </span>
  )
}

export function ProgressBar({ value, className, label }: { value: number; className?: string; label?: string }) {
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Completion'}
    >
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}
