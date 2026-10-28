'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, RotateCcw, Trash2 } from 'lucide-react'
import { useData } from '@/components/data-provider'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { replaceData } from '@/lib/store'
import { createEmptyData, createSampleData } from '@/lib/sample-data'
import { downloadFile } from '@/lib/export'
import { toDateInput } from '@/lib/metrics'

export function DataSettings() {
  const data = useData()
  const [confirm, setConfirm] = useState<'sample' | 'empty' | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Data is saved in this browser. Back it up regularly or reset the workspace.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadFile(`sop-tracker-backup-${toDateInput(new Date())}.json`, JSON.stringify(data, null, 2), 'application/json')}>
          <Download data-icon="inline-start" />
          Download backup (JSON)
        </Button>
        <Button variant="outline" onClick={() => setConfirm('sample')}>
          <RotateCcw data-icon="inline-start" />
          Restore sample data
        </Button>
        <Button variant="outline" className="text-destructive" onClick={() => setConfirm('empty')}>
          <Trash2 data-icon="inline-start" />
          Clear all data
        </Button>
      </CardContent>
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === 'sample' ? 'Restore sample data?' : 'Clear all data?'}
        confirmLabel={confirm === 'sample' ? 'Restore sample data' : 'Clear everything'}
        description={
          <p>
            All current streams, workstreams and SOPs will be replaced{confirm === 'empty' ? ' with an empty workspace (default statuses are kept)' : ' with the sample program'}.
            This cannot be undone.
          </p>
        }
        onConfirm={() => {
          replaceData(confirm === 'sample' ? createSampleData() : createEmptyData())
          toast.success(confirm === 'sample' ? 'Sample data restored.' : 'Workspace cleared.')
        }}
      />
    </Card>
  )
}
