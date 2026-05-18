import { Moon, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLocation } from 'react-router-dom'

import { NotificationBell } from '@/components/layout/NotificationBell'
import { UserMenu } from '@/components/layout/UserMenu'
import { mainNavigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function usePageTitle() {
  const { pathname } = useLocation()
  return (
    mainNavigation.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
      ?.title ?? 'GTI'
  )
}

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const pageTitle = usePageTitle()
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/88 px-4 backdrop-blur sm:px-5 lg:px-4">
      {/* Page title — visible on mobile only; desktop uses sidebar branding */}
      <p className="text-sm font-semibold lg:hidden">{pageTitle}</p>
      {/* Spacer on desktop so actions stay right-aligned */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Alternar tema"
          onClick={() => setTheme(nextTheme)}
        >
          {resolvedTheme === 'dark' ? <SunMedium /> : <Moon />}
        </Button>
        <NotificationBell />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <UserMenu />
      </div>
    </header>
  )
}
