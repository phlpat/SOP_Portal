'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useData } from '@/components/data-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PriorityBadge, StatusBadge } from '@/components/shared/badges'
import { buildSopRows, formatDate, toDateInput } from '@/lib/metrics'

export function AttentionList() {
  const data = useData()
  const today = toDateInput(new Date())
  const rows = useMemo(
    () =>
      buildSopRows(data)
        .filter((r) => !r.status?.countsAsComplete)
        .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
        .slice(0, 6),
    [data],
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Upcoming & Overdue SOPs</CardTitle>
          <CardDescription>Open SOPs ordered by nearest target date</CardDescription>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/sops" />}>
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">All SOPs are complete. Great work!</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SOP</TableHead>
                <TableHead className="hidden md:table-cell">Stream / Workstream</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                <TableHead className="text-right">Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const overdue = r.targetDate < today
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                        <span className="max-w-56 truncate font-medium">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {r.stream?.name} / {r.workstream?.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PriorityBadge priority={r.priority} />
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${overdue ? 'font-medium text-red-600' : ''}`}>
                      {formatDate(r.targetDate)}
                      {overdue && <span className="sr-only"> (overdue)</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
