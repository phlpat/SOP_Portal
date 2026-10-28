import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'
import { StatusSettings } from '@/components/settings/status-settings'
import { DataSettings } from '@/components/settings/data-settings'

export const metadata: Metadata = { title: 'Settings | SOP Tracker' }

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Configure SOP statuses and manage workspace data." />
      <StatusSettings />
      <DataSettings />
    </>
  )
}
