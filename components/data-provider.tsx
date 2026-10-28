'use client'

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { getServerSnapshot, getSnapshot, replaceData, subscribe } from '@/lib/store'
import type { ActionResult, AppData } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const DataContext = createContext<AppData | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!data) {
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

/** Runs a pure action against the latest data, persists it, and notifies the user. */
export function useCommit() {
  return useCallback((action: (data: AppData) => ActionResult): boolean => {
    const result = action(getSnapshot())
    if (result.ok) {
      replaceData(result.data)
      toast.success(result.message)
      return true
    }
    toast.error(result.error)
    return false
  }, [])
}
