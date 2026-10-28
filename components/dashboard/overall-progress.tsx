import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/shared/badges'
import type { ProgramMetrics } from '@/lib/metrics'

export function OverallProgress({ metrics, className }: { metrics: ProgramMetrics; className?: string }) {
  const rows = [
    { label: 'Completed', value: metrics.completed, color: 'bg-emerald-600' },
    { label: 'In progress', value: metrics.inProgress, color: 'bg-blue-600' },
    { label: 'Pending', value: metrics.pending, color: 'bg-amber-500' },
    { label: 'Not started', value: metrics.notStarted, color: 'bg-slate-400' },
    { label: 'On hold', value: metrics.onHold, color: 'bg-rose-500' },
  ]
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Overall Program Progress</CardTitle>
        <CardDescription>Share of SOPs in a completed status</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight text-primary">{metrics.completionRate}%</span>
          <span className="pb-1.5 text-sm text-muted-foreground">
            {metrics.completed} of {metrics.sops} SOPs
          </span>
        </div>
        <ProgressBar value={metrics.completionRate} className="h-3" label="Overall program completion" />
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className={`size-2 rounded-full ${r.color}`} aria-hidden="true" />
                {r.label}
              </span>
              <span className="font-medium tabular-nums text-foreground">{r.value}</span>
            </li>
          ))}
        </ul>
        {metrics.overdue > 0 && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {metrics.overdue} open SOP{metrics.overdue === 1 ? ' is' : 's are'} past the target date.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
