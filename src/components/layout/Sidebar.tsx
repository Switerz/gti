import { NavLink } from 'react-router-dom'
import { PackageCheck } from 'lucide-react'

import { mainNavigation } from '@/components/layout/navigation'
import { cn } from '@/lib/utils'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">GTI</p>
          <p className="text-xs text-muted-foreground">Gestão de Tarefas Inteligente</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {mainNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-primary/10 text-primary',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        GTI v1.0 · Gogroup Transport
      </div>
    </aside>
  )
}
