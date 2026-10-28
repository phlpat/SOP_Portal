import type { Metadata } from 'next'
import { StreamDetailView } from '@/components/streams/stream-detail-view'

export const metadata: Metadata = { title: 'Stream | SOP Tracker' }

export default async function StreamPage({ params }: { params: Promise<{ streamId: string }> }) {
  const { streamId } = await params
  return <StreamDetailView streamId={streamId} />
}
