import { useState } from 'react'

import { AlertTriangle, Check, Clipboard, KeyRound, Pencil, Plug, ShieldAlert, Tag, Terminal, Trash2, UserCog } from 'lucide-react'

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
import {
  useCategoriesAdmin,
  useCreateCategory,
  useRemoveCategory,
  useUpdateCategory,
} from '@/hooks/useCategories'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useSession } from '@/hooks/useSession'
import { canManageAllowlist, canManageCategories } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import type { AllowedEmail, Category, UserRole } from '@/types/domain'

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

function formatExpiresAt(expiresAt?: number) {
  if (!expiresAt) return 'indisponivel'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(expiresAt * 1000))
}

function getTokenState(expiresAt?: number) {
  if (!expiresAt) return { label: 'Expiração indisponível', expired: false, expiringSoon: false }

  const millisecondsLeft = expiresAt * 1000 - Date.now()
  if (millisecondsLeft <= 0) return { label: 'Token expirado', expired: true, expiringSoon: false }

  const minutesLeft = Math.floor(millisecondsLeft / 60_000)
  if (minutesLeft <= 15) {
    return {
      label: `Expira em ${Math.max(minutesLeft, 1)} min`,
      expired: false,
      expiringSoon: true,
    }
  }

  const hoursLeft = Math.floor(minutesLeft / 60)
  return {
    label: hoursLeft > 0 ? `Expira em ${hoursLeft}h ${minutesLeft % 60}min` : `Expira em ${minutesLeft} min`,
    expired: false,
    expiringSoon: false,
  }
}

function McpIntegrationCard() {
  const { data: session, refetch, isFetching } = useSession()
  const [copied, setCopied] = useState<'url' | 'token' | 'codex' | 'claude' | 'local' | null>(null)
  const accessToken = session?.access_token
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  const tokenState = getTokenState(session?.expires_at)
  const isReady = Boolean(accessToken && supabaseUrl && supabaseAnonKey && !tokenState.expired)
  const remoteMcpUrl =
    typeof window === 'undefined' ? 'https://go-gti.vercel.app/api/mcp' : `${window.location.origin}/api/mcp`

  async function refreshSession() {
    await supabase.auth.refreshSession()
    await refetch()
  }

  async function copyText(kind: 'url' | 'token' | 'codex' | 'claude' | 'local', text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const codexSnippet = isReady
    ? [
        '[mcp_servers.gti]',
        `url = "${remoteMcpUrl}"`,
        `http_headers = { Authorization = "Bearer ${accessToken}" }`,
      ].join('\n')
    : ''

  const claudeCommand = isReady
    ? `claude mcp add --transport http gti "${remoteMcpUrl}" --header "Authorization: Bearer ${accessToken}"`
    : ''

  const localDevSnippet = isReady
    ? JSON.stringify(
        {
          mcpServers: {
            gti: {
              command: 'node',
              args: ['mcp/dist/server.js'],
              env: {
                VITE_SUPABASE_URL: supabaseUrl,
                VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
                GTI_MCP_USER_ACCESS_TOKEN: accessToken,
              },
            },
          },
        },
        null,
        2,
      )
    : ''

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plug className="h-4 w-4" />
          MCP
        </CardTitle>
        <CardDescription>Conector remoto para Codex e Claude usando sua sessão atual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                {isReady ? 'Sessão pronta' : tokenState.expired ? 'Sessão expirada' : 'Sessão indisponível'}
              </div>
              <p className="text-xs text-muted-foreground">
                Expiração: {formatExpiresAt(session?.expires_at)} · {tokenState.label}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={refreshSession} disabled={isFetching}>
              {isFetching ? 'Atualizando...' : 'Atualizar sessão'}
            </Button>
          </div>
        </div>

        {(tokenState.expired || tokenState.expiringSoon) && (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {tokenState.expired
                ? 'Atualize a sessão antes de copiar o token para o MCP.'
                : 'O token está perto de expirar. Atualize a sessão antes de iniciar um fluxo longo.'}
            </p>
          </div>
        )}

        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="break-all text-xs text-muted-foreground">{remoteMcpUrl}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyText('url', remoteMcpUrl)}
          >
            {copied === 'url' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            URL remota
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!accessToken || tokenState.expired}
            onClick={() => accessToken && copyText('token', accessToken)}
          >
            {copied === 'token' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            Token
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isReady}
            onClick={() => copyText('codex', codexSnippet)}
          >
            {copied === 'codex' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            Codex
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isReady}
            onClick={() => copyText('claude', claudeCommand)}
          >
            {copied === 'claude' ? <Check className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
            Claude Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isReady}
            onClick={() => copyText('local', localDevSnippet)}
          >
            {copied === 'local' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            local dev
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Use a URL remota em clientes MCP com suporte a HTTP. O token permite operar como seu usuário até expirar; não envie em conversas públicas e nunca copie refresh token.
        </p>
      </CardContent>
    </Card>
  )
}

// ── Allowlist row ─────────────────────────────────────────────────────────────

function AllowlistRow({ entry, isLastAdmin }: { entry: AllowedEmail; isLastAdmin: boolean }) {
  const updateEntry = useUpdateAllowlistEntry()
  const removeEntry = useRemoveAllowlistEntry()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <tr className="border-b last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-3 text-sm">{entry.email}</td>
      <td className="px-4 py-3">
        <Select
          value={entry.role}
          onValueChange={(v) => updateEntry.mutate({ id: entry.id, email: entry.email, role: v as UserRole })}
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
          onClick={() => updateEntry.mutate({ id: entry.id, email: entry.email, active: !entry.active })}
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
          disabled={isLastAdmin}
          title={isLastAdmin ? 'Não é possível remover o único administrador' : 'Remover'}
          className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
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
  const adminCount = entries.filter((e) => e.role === 'admin').length

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
                  <AllowlistRow
                    key={e.id}
                    entry={e}
                    isLastAdmin={e.role === 'admin' && adminCount === 1}
                  />
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

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({ category }: { category: Category }) {
  const updateCategory = useUpdateCategory()
  const removeCategory = useRemoveCategory()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const [editColor, setEditColor] = useState(category.color ?? '#6366f1')
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleSave() {
    if (!editName.trim()) return
    await updateCategory.mutateAsync({ id: category.id, name: editName, color: editColor })
    setEditing(false)
  }

  return (
    <tr className="group border-b last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border"
              title="Cor da categoria"
            />
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') { setEditName(category.name); setEditing(false) }
              }}
              className="h-7 w-44 text-sm"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: category.color ?? '#6366f1' }}
            />
            <span className="text-sm font-medium">{category.name}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{category.slug}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => updateCategory.mutate({ id: category.id, active: !category.active })}
          className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            category.active ? 'bg-primary' : 'bg-muted'
          }`}
          title={category.active ? 'Desativar' : 'Ativar'}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
              category.active ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <Button
                size="sm"
                variant="default"
                className="h-6 px-2 text-xs"
                onClick={handleSave}
                disabled={updateCategory.isPending}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => { setEditName(category.name); setEditing(false) }}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditName(category.name); setEditColor(category.color ?? '#6366f1'); setEditing(true) }}
                className="invisible rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:visible"
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="invisible rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive group-hover:visible"
                title="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </td>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover categoria?</DialogTitle>
            <DialogDescription>
              <strong>{category.name}</strong> será removida permanentemente. Tarefas vinculadas
              perdem a categoria. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await removeCategory.mutateAsync(category.id)
                setConfirmOpen(false)
              }}
              disabled={removeCategory.isPending}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </tr>
  )
}

// ── Add category form ─────────────────────────────────────────────────────────

function AddCategoryForm() {
  const createCategory = useCreateCategory()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!name.trim()) { setError('Informe um nome.'); return }
    await createCategory.mutateAsync({ name, color })
    setName('')
    setColor('#6366f1')
    setError('')
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-end gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Cor</Label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border"
            title="Escolher cor"
          />
        </div>
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="cat-name" className="text-xs">Nome</Label>
          <Input
            id="cat-name"
            placeholder="Ex: Manutenção, Compliance…"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            className="h-8 text-sm"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
      <Button size="sm" onClick={handleAdd} disabled={createCategory.isPending}>
        {createCategory.isPending ? 'Criando…' : 'Criar categoria'}
      </Button>
    </div>
  )
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection() {
  const { data: categories = [], isLoading } = useCategoriesAdmin()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4" />
          Categorias
        </CardTitle>
        <CardDescription>
          Categorias organizam as tarefas. Categorias inativas não aparecem nos seletores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddCategoryForm />

        <Separator />

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria cadastrada.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Categoria', 'Slug', 'Ativa', ''].map((h) => (
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
                {categories.map((c) => (
                  <CategoryRow key={c.id} category={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {categories.length} categoria{categories.length !== 1 ? 's' : ''} ·{' '}
          {categories.filter((c) => c.active).length} ativa
          {categories.filter((c) => c.active).length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { data: currentProfile } = useCurrentProfile()
  const isAdmin = canManageAllowlist(currentProfile)
  const canCategories = canManageCategories(currentProfile)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Governança de acesso e ajustes administrativos."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <MyProfileCard />
        <McpIntegrationCard />

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

        {canCategories && <CategorySection />}
      </div>
    </section>
  )
}
