'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, HardDriveDownload, RotateCcw, Trash2 } from 'lucide-react'
import { useData } from '@/components/data-provider'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { commitData } from '@/lib/store'
import { createEmptyData, createSampleData } from '@/lib/sample-data'
import { downloadFile } from '@/lib/export'
import { toDateInput } from '@/lib/metrics'
import type { AppData } from '@/lib/types'

/** Where the app kept its data before it moved to the shared database. */
const LEGACY_STORAGE_KEY = 'sop-tracker:data:v1'

type Mode = 'sample' | 'empty' | 'browser'

function readLegacyData(): AppData | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    const v = raw ? (JSON.parse(raw) as Partial<AppData>) : null
    if (v && Array.isArray(v.streams) && Array.isArray(v.workstreams) && Array.isArray(v.statuses) && Array.isArray(v.sops)) {
      return { version: 1, streams: v.streams, workstreams: v.workstreams, statuses: v.statuses, sops: v.sops }
    }
  } catch {
    // Unreadable storage is treated the same as no data.
  }
  return null
}

const COPY: Record<Mode, { title: string; confirmLabel: string; success: string; replaceWith: string }> = {
  sample: { title: 'Restore sample data?', confirmLabel: 'Restore sample data', success: 'Sample data restored.', replaceWith: 'the sample program' },
  empty: { title: 'Clear all data?', confirmLabel: 'Clear everything', success: 'Workspace cleared.', replaceWith: 'an empty workspace (default statuses are kept)' },
  browser: { title: 'Import data from this browser?', confirmLabel: 'Import and replace', success: 'Data imported from this browser.', replaceWith: "the data saved in this browser's old storage" },
}

export function DataSettings() {
  const data = useData()
  const [confirm, setConfirm] = useState<Mode | null>(null)
  const copy = confirm ? COPY[confirm] : null

  function run(mode: Mode) {
    const next = mode === 'sample' ? createSampleData() : mode === 'empty' ? createEmptyData() : readLegacyData()
    if (!next) {
      toast.error('No saved data found in this browser.')
      return
    }
    commitData(next).then(
      () => toast.success(COPY[mode].success),
      (e: unknown) => toast.error(`Not saved: ${e instanceof Error ? e.message : 'database error'}.`),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Data is saved in the shared database, so changes here affect everyone. Download a backup before resetting the workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadFile(`sop-tracker-backup-${toDateInput(new Date())}.json`, JSON.stringify(data, null, 2), 'application/json')}>
          <Download data-icon="inline-start" />
          Download backup (JSON)
        </Button>
        <Button variant="outline" onClick={() => setConfirm('browser')}>
          <HardDriveDownload data-icon="inline-start" />
          Import from this browser
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
        title={copy?.title ?? ''}
        confirmLabel={copy?.confirmLabel ?? ''}
        description={
          <p>
            All current streams, workstreams and SOPs in the shared database will be replaced with {copy?.replaceWith}. This affects everyone using the portal and cannot be undone.
          </p>
        }
        onConfirm={() => confirm && run(confirm)}
      />
    </Card>
  )
}
