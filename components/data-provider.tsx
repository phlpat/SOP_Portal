'use client'

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { commitData, getServerSnapshot, getSnapshot, reload, subscribe } from '@/lib/store'
import type { ActionResult, AppData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const DataContext = createContext<AppData | null>(null)

/** How long the tab may stay hidden before returning to it refreshes the data. */
const REFRESH_AFTER_MS = 30_000

export function DataProvider({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    reload().catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'Could not load data.'))
  }, [])

  useEffect(() => {
    load()
    // Other people edit the same database, so refresh when the user comes back to the tab.
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > REFRESH_AFTER_MS) reload().catch(() => undefined)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [load])

  if (!data) {
    if (loadError) {
      return (
        <div className="flex flex-col items-start gap-3 p-6" role="alert">
          <p className="font-medium text-foreground">Could not load data from the database.</p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" onClick={load}>
            Try again
          </Button>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-4 p-6" aria-busy="true" aria-label="Loading data">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>
}

export function useData(): AppData {
  const data = useContext(DataContext)
  if (!data) throw new Error('useData must be used inside <DataProvider>')
  return data
}

/** Runs a pure action against the latest data, saves it to the database, and notifies the user. */
export function useCommit() {
  return useCallback((action: (data: AppData) => ActionResult): boolean => {
    const current = getSnapshot()
    if (!current) return false
    const result = action(current)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    commitData(result.data).then(
      () => toast.success(result.message),
      (e: unknown) => toast.error(`Not saved: ${e instanceof Error ? e.message : 'database error'}. Showing the latest saved data.`),
    )
    return true
  }, [])
}
