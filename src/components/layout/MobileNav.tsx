import { NavLink } from 'react-router-dom'

import { mainNavigation } from '@/components/layout/navigation'
import { cn } from '@/lib/utils'

const visibleItems = mainNavigation.slice(0, 5)

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 px-1 py-2 backdrop-blur lg:hidden">
      {visibleItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-medium text-muted-foreground',
              isActive && 'bg-primary/10 text-primary',
            )
          }
        >
          <item.icon className="h-4 w-4" />
          <span className="w-full truncate text-center">{item.shortTitle ?? item.title}</span>
        </NavLink>
      ))}
    </nav>
  )
}
