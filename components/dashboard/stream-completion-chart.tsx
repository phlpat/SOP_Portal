'use client'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { EmptyState } from '@/components/shared/page-header'
import type { GroupStats } from '@/lib/metrics'
import type { Stream } from '@/lib/types'

const config = {
  completionRate: { label: 'Completion %', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function StreamCompletionChart({ rows, className }: { rows: { stream: Stream; stats: GroupStats }[]; className?: string }) {
  const chartData = rows.map((r) => ({
    name: r.stream.name,
    completionRate: r.stats.completionRate,
    detail: `${r.stats.completed}/${r.stats.sopCount}`,
  }))
  const height = Math.max(220, chartData.length * 48)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Completion Rate by Stream</CardTitle>
        <CardDescription>Percentage of each stream&apos;s SOPs that are completed</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState title="No streams yet" description="Create a stream to see its completion rate here." />
        ) : (
          <ChartContainer config={config} className="w-full" style={{ height }}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent formatter={(v, _n, item) => `${v}% (${item.payload.detail} SOPs)`} />} />
              <Bar dataKey="completionRate" fill="var(--color-completionRate)" radius={4} barSize={22}>
                <LabelList dataKey="completionRate" position="right" formatter={(v: number) => `${v}%`} className="fill-foreground text-xs" />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
