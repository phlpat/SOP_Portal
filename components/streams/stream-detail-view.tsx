'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, FileText, Hourglass, Network } from 'lucide-react'
import { useData } from '@/components/data-provider'
import { EmptyState, PageHeader } from '@/components/shared/page-header'
import { ProgressBar } from '@/components/shared/badges'
import { SopsView } from '@/components/sops/sops-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getProgramMetrics, getWorkstreamStats, scopeToStream } from '@/lib/metrics'

export function StreamDetailView({ streamId }: { streamId: string }) {
  const data = useData()
  const stream = data.streams.find((s) => s.id === streamId)
  const scoped = useMemo(() => scopeToStream(data, streamId), [data, streamId])
  const metrics = useMemo(() => getProgramMetrics(scoped), [scoped])
  const wsStats = useMemo(() => getWorkstreamStats(scoped), [scoped])

  if (!stream) {
    return (
      <EmptyState
        title="Stream not found"
        description="This stream may have been deleted or the data in this browser was reset."
        action={
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            <ArrowLeft data-icon="inline-start" />
            Back to dashboard
          </Button>
        }
      />
    )
  }

  const items = [
    { label: 'Workstreams', value: metrics.workstreams, icon: Network, hint: 'In this stream' },
    { label: 'Total SOPs', value: metrics.sops, icon: FileText, hint: `${metrics.completionRate}% completed` },
    { label: 'Completed', value: metrics.completed, icon: CheckCircle2, hint: 'Signed off', accent: 'text-emerald-600' },
    { label: 'In Progress', value: metrics.inProgress, icon: Clock, hint: 'Being drafted', accent: 'text-blue-600' },
    { label: 'Pending', value: metrics.pending, icon: Hourglass, hint: 'Review / sign-off', accent: 'text-amber-600' },
    { label: 'Overdue', value: metrics.overdue, icon: AlertTriangle, hint: 'Past target date', accent: metrics.overdue ? 'text-red-600' : 'text-muted-foreground' },
  ]

  return (
    <>
      <PageHeader title={stream.name} description={stream.description || 'SOP delivery for this stream.'} />

      <section aria-label={`${stream.name} summary`} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <Card key={item.label} className="gap-0 py-4">
            <CardContent className="flex flex-col gap-2 px-4">
              <div className="flex min-h-8 items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <item.icon className={`size-4 ${item.accent ?? 'text-primary'}`} aria-hidden="true" />
              </div>
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</span>
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Workstream Progress</CardTitle>
          <CardDescription>Completion for each workstream in {stream.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {scoped.workstreams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workstreams in this stream yet. Add one under Workstream Management.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {scoped.workstreams.map((ws) => {
                const w = wsStats.get(ws.id)!
                return (
                  <li key={ws.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,14rem)_1fr_5rem]">
                    <span className="truncate text-sm text-foreground">{ws.name}</span>
                    <span className="text-right text-xs tabular-nums text-muted-foreground sm:order-last">
                      {w.completed}/{w.sopCount} · {w.completionRate}%
                    </span>
                    <ProgressBar value={w.completionRate} className="col-span-2 sm:col-span-1" label={`${ws.name} completion`} />
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <SopsView streamId={streamId} />
    </>
  )
}
