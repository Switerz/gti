import { Outlet } from 'react-router-dom'

import { MobileNav } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export function AppShell() {
  useRealtimeSync()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <Topbar />
        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
