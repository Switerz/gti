import { NavLink } from 'react-router-dom'
import { PackageCheck } from 'lucide-react'

import { mainNavigation } from '@/components/layout/navigation'
import { cn } from '@/lib/utils'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <PackageCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">GTI</p>
          <p className="truncate text-[11px] text-muted-foreground">Transportes Gogroup</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2.5 py-3">
        {mainNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-primary/10 text-primary',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>
      <div className="border-t px-4 py-3 text-[11px] text-muted-foreground">
        GTI v1.0
      </div>
    </aside>
  )
}
