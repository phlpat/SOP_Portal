'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '@/components/data-provider'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { getProgramMetrics, getStatusDistribution, getStreamStats } from '@/lib/metrics'
import { SummaryCards } from './summary-cards'
import { OverallProgress } from './overall-progress'
import { StreamCompletionChart } from './stream-completion-chart'
import { StatusDistributionChart } from './status-distribution-chart'
import { StreamBreakdown } from './stream-breakdown'
import { AttentionList } from './attention-list'

export function DashboardView() {
  const data = useData()
  const metrics = useMemo(() => getProgramMetrics(data), [data])
  const streamStats = useMemo(() => getStreamStats(data), [data])
  const distribution = useMemo(() => getStatusDistribution(data), [data])

  const streamRows = data.streams.map((stream) => ({ stream, stats: streamStats.get(stream.id)! }))

  return (
    <>
      <PageHeader
        title="Program Dashboard"
        description="Live view of SOP delivery across every stream and workstream."
        actions={
          <Button nativeButton={false} render={<Link href="/sops?new=1" />}>
            <Plus data-icon="inline-start" />
            Add SOP
          </Button>
        }
      />
      <SummaryCards metrics={metrics} />
      <div className="grid gap-6 lg:grid-cols-3">
        <OverallProgress metrics={metrics} className="lg:col-span-1" />
        <StreamCompletionChart rows={streamRows} className="lg:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <StatusDistributionChart distribution={distribution} total={metrics.sops} className="lg:col-span-1" />
        <StreamBreakdown className="lg:col-span-2" />
      </div>
      <AttentionList />
    </>
  )
}
