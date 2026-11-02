'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, HardDriveDownload } from 'lucide-react'
import { useData } from '@/components/data-provider'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { commitData } from '@/lib/store'
import { downloadFile } from '@/lib/export'
import { toDateInput } from '@/lib/metrics'
import type { AppData } from '@/lib/types'

/** Where the app kept its data before it moved to the shared database. */
const LEGACY_STORAGE_KEY = 'sop-tracker:data:v1'

function readLegacyData(): AppData | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    const v = raw ? (JSON.parse(raw) as Partial<AppData>) : null
    if (v && Array.isArray(v.streams) && Array.isArray(v.workstreams) && Array.isArray(v.statuses) && Array.isArray(v.sops)) {
      // Data saved before the document link existed has no docUrl.
      const sops = v.sops.map((s) => ({ ...s, docUrl: s.docUrl ?? '' }))
      return { version: 1, streams: v.streams, workstreams: v.workstreams, statuses: v.statuses, sops }
    }
  } catch {
    // Unreadable storage is treated the same as no data.
  }
  return null
}

export function DataSettings() {
  const data = useData()
  const [confirmImport, setConfirmImport] = useState(false)

  function importFromBrowser() {
    const next = readLegacyData()
    if (!next) {
      toast.error('No saved data found in this browser.')
      return
    }
    commitData(next).then(
      () => toast.success('Data imported from this browser.'),
      (e: unknown) => toast.error(`Not saved: ${e instanceof Error ? e.message : 'database error'}.`),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Data is saved in the shared database, so changes here affect everyone. Download a backup regularly.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadFile(`sop-tracker-backup-${toDateInput(new Date())}.json`, JSON.stringify(data, null, 2), 'application/json')}>
          <Download data-icon="inline-start" />
          Download backup (JSON)
        </Button>
        <Button variant="outline" onClick={() => setConfirmImport(true)}>
          <HardDriveDownload data-icon="inline-start" />
          Import from this browser
        </Button>
      </CardContent>
      <ConfirmDialog
        open={confirmImport}
        onOpenChange={setConfirmImport}
        title="Import data from this browser?"
        confirmLabel="Import and replace"
        description={
          <p>
            All current streams, workstreams and SOPs in the shared database will be replaced with the data saved in this browser&apos;s old storage. This affects
            everyone using the portal and cannot be undone.
          </p>
        }
        onConfirm={importFromBrowser}
      />
    </Card>
  )
}
