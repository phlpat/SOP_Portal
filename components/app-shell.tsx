'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { FileCheck2, FolderKanban, Layers, LayoutDashboard, Network, Settings, Store, type LucideIcon } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { DataProvider } from '@/components/data-provider'
import { getServerSnapshot, getSnapshot, subscribe } from '@/lib/store'

const OVERVIEW_NAV = [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }]

const MANAGE_NAV = [
  { href: '/streams', label: 'Stream Management', icon: Layers },
  { href: '/workstreams', label: 'Workstream Management', icon: Network },
  { href: '/sops', label: 'SOP Management', icon: FileCheck2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const NAV = [...OVERVIEW_NAV, ...MANAGE_NAV]

const isActive = (pathname: string, href: string) => (href === '/' || href === '/streams' ? pathname === href : pathname.startsWith(href))

/** The shell sits outside <DataProvider>, so it reads the store directly; null until hydrated. */
function useStreams() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)?.streams ?? []
}

function NavGroup({ label, items, pathname }: { label: string; items: { href: string; label: string; icon: LucideIcon }[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton isActive={isActive(pathname, item.href)} tooltip={item.label} render={<Link href={item.href} />}>
                <item.icon aria-hidden="true" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function AppSidebar() {
  const pathname = usePathname()
  const streams = useStreams()
  const streamItems = streams.map((s) => ({ href: `/streams/${s.id}`, label: s.name, icon: FolderKanban }))
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} tooltip="SOP Tracker">
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Store className="size-4" aria-hidden="true" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">SOP Tracker</span>
                <span className="truncate text-xs opacity-70">Retail Transformation</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Overview" items={OVERVIEW_NAV} pathname={pathname} />
        {streamItems.length > 0 && <NavGroup label="Streams" items={streamItems} pathname={pathname} />}
        <NavGroup label="Manage" items={MANAGE_NAV} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 pb-1 text-xs leading-relaxed opacity-70 group-data-[collapsible=icon]:hidden">
          Data is saved in the shared database.
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const streams = useStreams()
  const title = NAV.find((n) => isActive(pathname, n.href))?.label ?? streams.find((s) => pathname === `/streams/${s.id}`)?.name
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground">{title ?? 'SOP Tracker'}</span>
        </header>
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          <DataProvider>{children}</DataProvider>
        </div>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}
