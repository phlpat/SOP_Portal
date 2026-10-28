import { CheckCircle2, Clock, FileText, Hourglass, Layers, Network } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { ProgramMetrics } from '@/lib/metrics'

export function SummaryCards({ metrics }: { metrics: ProgramMetrics }) {
  const items = [
    { label: 'Total Streams', value: metrics.streams, icon: Layers, hint: 'Program streams' },
    { label: 'Total Workstreams', value: metrics.workstreams, icon: Network, hint: 'Across all streams' },
    { label: 'Total SOPs', value: metrics.sops, icon: FileText, hint: `${metrics.overdue} overdue` },
    { label: 'Completed SOPs', value: metrics.completed, icon: CheckCircle2, hint: `${metrics.completionRate}% of total`, accent: 'text-emerald-600' },
    { label: 'In Progress SOPs', value: metrics.inProgress, icon: Clock, hint: 'Actively being drafted', accent: 'text-blue-600' },
    { label: 'Pending SOPs', value: metrics.pending, icon: Hourglass, hint: 'Awaiting review / sign-off', accent: 'text-amber-600' },
  ]
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} className="gap-0 py-4">
          <CardContent className="flex flex-col gap-2 px-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              <item.icon className={`size-4 ${item.accent ?? 'text-primary'}`} aria-hidden="true" />
            </div>
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.hint}</span>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
