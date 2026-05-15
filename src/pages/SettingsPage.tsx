import { useState } from 'react'

import { ShieldAlert, Trash2, UserCog } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAddAllowlistEntry,
  useAllowlist,
  useRemoveAllowlistEntry,
  useUpdateAllowlistEntry,
} from '@/hooks/useAllowlist'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { canManageAllowlist } from '@/lib/permissions'
import type { AllowedEmail, UserRole } from '@/types/domain'

import { PageHeader } from './PageHeader'

// ── Role labels ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'lead', label: 'Lead' },
  { value: 'member', label: 'Membro' },
]

const ROLE_BADGE: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  lead: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

// ── My profile card ───────────────────────────────────────────────────────────

function MyProfileCard() {
  const { data: profile } = useCurrentProfile()

  const initials = profile?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCog className="h-4 w-4" />
          Meu perfil
        </CardTitle>
        <CardDescription>Dados sincronizados via Google OAuth.</CardDescription>
      </CardHeader>
      <CardContent>
        {!profile ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="font-semibold">{profile.full_name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[profile.role]}`}
              >
                {ROLE_OPTIONS.find((r) => r.value === profile.role)?.label ?? profile.role}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Allowlist row ─────────────────────────────────────────────────────────────

function AllowlistRow({ entry }: { entry: AllowedEmail }) {
  const updateEntry = useUpdateAllowlistEntry()
  const removeEntry = useRemoveAllowlistEntry()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <tr className="border-b last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-3 text-sm">{entry.email}</td>
      <td className="px-4 py-3">
        <Select
          value={entry.role}
          onValueChange={(v) => updateEntry.mutate({ id: entry.id, role: v as UserRole })}
        >
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => updateEntry.mutate({ id: entry.id, active: !entry.active })}
          className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            entry.active ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
              entry.active ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover da allowlist?</DialogTitle>
            <DialogDescription>
              <strong>{entry.email}</strong> não poderá mais acessar o GTI. Se já tiver conta,
              perderá acesso no próximo login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await removeEntry.mutateAsync(entry.id)
                setConfirmOpen(false)
              }}
              disabled={removeEntry.isPending}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </tr>
  )
}

// ── Add entry form ────────────────────────────────────────────────────────────

function AddAllowlistForm() {
  const addEntry = useAddAllowlistEntry()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um email válido.')
      return
    }
    await addEntry.mutateAsync({ email, role })
    setEmail('')
    setRole('member')
    setError('')
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4">
      <div className="min-w-[220px] flex-1 space-y-1.5">
        <Label htmlFor="al-email" className="text-xs">
          Email
        </Label>
        <Input
          id="al-email"
          type="email"
          placeholder="colaborador@gogroup.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          className="h-8 text-sm"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Perfil</Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" onClick={handleAdd} disabled={addEntry.isPending}>
        {addEntry.isPending ? 'Adicionando…' : 'Adicionar'}
      </Button>
    </div>
  )
}

// ── Allowlist section ─────────────────────────────────────────────────────────

function AllowlistSection() {
  const { data: entries = [], isLoading } = useAllowlist()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4" />
          Gerenciar allowlist
        </CardTitle>
        <CardDescription>
          Somente emails cadastrados aqui podem acessar o GTI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddAllowlistForm />

        <Separator />

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma entrada na allowlist.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Email', 'Perfil', 'Ativo', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <AllowlistRow key={e.id} entry={e} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {entries.length} entrada{entries.length !== 1 ? 's' : ''} cadastrada
          {entries.length !== 1 ? 's' : ''} ·{' '}
          {entries.filter((e) => e.active).length} ativa
          {entries.filter((e) => e.active).length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { data: currentProfile } = useCurrentProfile()
  const isAdmin = canManageAllowlist(currentProfile)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Governança de acesso e ajustes administrativos."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <MyProfileCard />

        {isAdmin ? (
          <AllowlistSection />
        ) : (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              Apenas administradores podem gerenciar a allowlist.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
