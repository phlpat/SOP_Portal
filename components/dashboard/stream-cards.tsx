'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useData } from '@/components/data-provider'
import { ProgressBar } from '@/components/shared/badges'
import { EmptyState } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { getProgramMetrics, scopeToStream } from '@/lib/metrics'

/** One card per stream; each links to that stream's own page. */
export function StreamCards() {
  const data = useData()
  const rows = useMemo(
    () => data.streams.map((stream) => ({ stream, m: getProgramMetrics(scopeToStream(data, stream.id)) })),
    [data],
  )

  if (rows.length === 0) {
    return <EmptyState title="No streams yet" description="Create a stream under Stream Management to start tracking SOPs." />
  }

  return (
    <section aria-label="Streams" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map(({ stream, m }) => (
        <Link key={stream.id} href={`/streams/${stream.id}`} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardContent className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="truncate font-semibold text-foreground">{stream.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {m.workstreams} workstreams · {m.sops} SOPs
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-xs tabular-nums text-muted-foreground">
                  <span>
                    {m.completed}/{m.sops} completed
                  </span>
                  <span className="font-medium text-foreground">{m.completionRate}%</span>
                </div>
                <ProgressBar value={m.completionRate} label={`${stream.name} completion`} />
              </div>
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{m.inProgress} in progress</span>
                <span>{m.pending} pending</span>
                {m.overdue > 0 && (
                  <span className="inline-flex items-center gap-1 font-medium text-red-600">
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    {m.overdue} overdue
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </section>
  )
}
