import type { Metadata } from 'next'
import { WorkstreamsView } from '@/components/workstreams/workstreams-view'

export const metadata: Metadata = { title: 'Workstream Management | SOP Tracker' }

export default function WorkstreamsPage() {
  return <WorkstreamsView />
}
