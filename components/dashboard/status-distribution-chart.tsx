'use client'

import { Cell, Pie, PieChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { STATUS_COLOR_STYLES } from '@/lib/colors'
import type { Status } from '@/lib/types'

interface Props {
  distribution: { status: Status; count: number }[]
  total: number
  className?: string
}

export function StatusDistributionChart({ distribution, total, className }: Props) {
  const config: ChartConfig = Object.fromEntries(
    distribution.map(({ status }) => [status.id, { label: status.name, color: STATUS_COLOR_STYLES[status.color].chart }]),
  )
  const chartData = distribution.filter((d) => d.count > 0).map((d) => ({ id: d.status.id, name: d.status.name, value: d.count, fill: STATUS_COLOR_STYLES[d.status.color].chart }))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>All SOPs by current status</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative">
          <ChartContainer config={config} className="mx-auto aspect-square h-52">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="id" hideLabel />} />
              <Pie data={chartData} dataKey="value" nameKey="id" innerRadius={58} outerRadius={88} strokeWidth={2} stroke="var(--background)">
                {chartData.map((d) => (
                  <Cell key={d.id} fill={d.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">SOPs</span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
          {distribution.map(({ status, count }) => (
            <li key={status.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span className={`size-2 shrink-0 rounded-full ${STATUS_COLOR_STYLES[status.color].dot}`} aria-hidden="true" />
                <span className="truncate">{status.name}</span>
              </span>
              <span className="font-medium tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
