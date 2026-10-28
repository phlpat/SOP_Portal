'use client'

import { useMemo } from 'react'
import { useData } from '@/components/data-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/shared/badges'
import { EmptyState } from '@/components/shared/page-header'
import { getStreamStats, getWorkstreamStats } from '@/lib/metrics'

export function StreamBreakdown({ className }: { className?: string }) {
  const data = useData()
  const streamStats = useMemo(() => getStreamStats(data), [data])
  const wsStats = useMemo(() => getWorkstreamStats(data), [data])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Workstream Progress</CardTitle>
        <CardDescription>Completion for each workstream, grouped by stream</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {data.streams.length === 0 && <EmptyState title="Nothing to show" description="Add streams and workstreams to track progress." />}
        {data.streams.map((stream) => {
          const s = streamStats.get(stream.id)!
          const workstreams = data.workstreams.filter((w) => w.streamId === stream.id)
          return (
            <div key={stream.id} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2 border-b pb-2">
                <h3 className="text-sm font-semibold text-foreground">{stream.name}</h3>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {s.completed}/{s.sopCount} SOPs · {s.completionRate}%
                </span>
              </div>
              {workstreams.length === 0 ? (
                <p className="text-xs text-muted-foreground">No workstreams in this stream yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {workstreams.map((ws) => {
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
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
