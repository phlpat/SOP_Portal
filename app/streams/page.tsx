import type { Metadata } from 'next'
import { StreamsView } from '@/components/streams/streams-view'

export const metadata: Metadata = { title: 'Stream Management | SOP Tracker' }

export default function StreamsPage() {
  return <StreamsView />
}
