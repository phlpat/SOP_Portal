'use client'

import { useMemo } from 'react'
import { useData } from '@/components/data-provider'
import { PageHeader } from '@/components/shared/page-header'
import { getProgramMetrics, getStatusDistribution } from '@/lib/metrics'
import { SummaryCards } from './summary-cards'
import { OverallProgress } from './overall-progress'
import { StatusDistributionChart } from './status-distribution-chart'
import { StreamCards } from './stream-cards'
import { AttentionList } from './attention-list'

export function DashboardView() {
  const data = useData()
  const metrics = useMemo(() => getProgramMetrics(data), [data])
  const distribution = useMemo(() => getStatusDistribution(data), [data])

  return (
    <>
      <PageHeader title="Program Dashboard" description="Overview of every stream. Select a stream to see its workstreams and SOPs." />
      <SummaryCards metrics={metrics} />
      <StreamCards />
      <div className="grid gap-6 lg:grid-cols-3">
        <OverallProgress metrics={metrics} className="lg:col-span-1" />
        <StatusDistributionChart distribution={distribution} total={metrics.sops} className="lg:col-span-2" />
      </div>
      <AttentionList />
    </>
  )
}
