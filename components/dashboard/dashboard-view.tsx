'use client'

import { useMemo, useState } from 'react'
import { ScopedData, useData } from '@/components/data-provider'
import { OptionSelect } from '@/components/shared/option-select'
import { PageHeader } from '@/components/shared/page-header'
import { getProgramMetrics, getStatusDistribution, scopeToStream } from '@/lib/metrics'
import { SummaryCards } from './summary-cards'
import { OverallProgress } from './overall-progress'
import { StatusDistributionChart } from './status-distribution-chart'
import { StreamCards } from './stream-cards'
import { AttentionList } from './attention-list'

const ALL = 'all'

export function DashboardView() {
  const data = useData()
  const [streamFilter, setStreamFilter] = useState(ALL)

  // A deleted stream falls back to "All streams" instead of showing an empty dashboard.
  const streamId = data.streams.some((s) => s.id === streamFilter) ? streamFilter : ALL
  const scoped = useMemo(() => (streamId === ALL ? data : scopeToStream(data, streamId)), [data, streamId])
  const metrics = useMemo(() => getProgramMetrics(scoped), [scoped])
  const distribution = useMemo(() => getStatusDistribution(scoped), [scoped])

  return (
    <>
      <PageHeader
        title="Program Dashboard"
        description="Overview of every stream. Select a stream to see its workstreams and SOPs."
        actions={
          <OptionSelect
            className="w-full sm:w-64"
            aria-label="Filter dashboard by stream"
            value={streamId}
            onChange={(v) => setStreamFilter(v || ALL)}
            options={[{ value: ALL, label: 'All streams' }, ...data.streams.map((s) => ({ value: s.id, label: s.name }))]}
          />
        }
      />
      {/* Everything below reads from the filtered data. */}
      <ScopedData data={scoped}>
        <SummaryCards metrics={metrics} />
        <StreamCards />
        <div className="grid gap-6 lg:grid-cols-3">
          <OverallProgress metrics={metrics} className="lg:col-span-1" />
          <StatusDistributionChart distribution={distribution} total={metrics.sops} className="lg:col-span-2" />
        </div>
        <AttentionList />
      </ScopedData>
    </>
  )
}
