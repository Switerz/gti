import { LogOut } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { authService } from '@/features/auth/auth.service'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'

export function UserMenu() {
  const { data: profile } = useCurrentProfile()

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'GT'

  async function handleSignOut() {
    await authService.signOut()
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? 'Usuário'} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium">{profile?.full_name ?? 'Carregando...'}</p>
        <p className="text-xs text-muted-foreground capitalize">{profile?.role ?? ''}</p>
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label="Sair" onClick={handleSignOut}>
        <LogOut />
      </Button>
    </div>
  )
}
