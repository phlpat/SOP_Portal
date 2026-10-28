import type { Metadata } from 'next'
import { SopsView } from '@/components/sops/sops-view'

export const metadata: Metadata = { title: 'SOP Management | SOP Tracker' }

export default async function SopsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: openNew } = await searchParams
  return <SopsView openNew={openNew === '1'} />
}
