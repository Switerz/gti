import { useState } from 'react'

import { FolderOpen, Plus } from 'lucide-react'

import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/hooks/useCategories'
import { useCreateProject } from '@/hooks/useCreateProject'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useProjects } from '@/hooks/useProjects'
import { formatDateTime } from '@/lib/dates'
import { canManageProjects } from '@/lib/permissions'
import { fromOptionalSelectValue, SELECT_NONE_VALUE, toSelectValue } from '@/lib/select-values'
import type { ProjectWithCategory } from '@/types/domain'

import { PageHeader } from './PageHeader'

// ── Create dialog ─────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  createdBy: string
}

function ProjectCreateDialog({ open, onOpenChange, createdBy }: CreateDialogProps) {
  const { data: categories = [] } = useCategories()
  const createProject = useCreateProject(createdBy)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name.trim()) { setError('Informe um nome.'); return }
    await createProject.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId || undefined,
    })
    setName(''); setDescription(''); setCategoryId(''); setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>Preencha os dados para criar o projeto.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proj-name"
              placeholder="Ex: Frota SP 2025"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Descrição</Label>
            <Textarea
              id="proj-desc"
              rows={3}
              placeholder="Objetivo do projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select
              value={toSelectValue(categoryId)}
              onValueChange={(value) => setCategoryId(fromOptionalSelectValue(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_NONE_VALUE}>Nenhuma</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createProject.isPending}>
            {createProject.isPending ? 'Criando…' : 'Criar projeto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectWithCategory }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{project.name}</CardTitle>
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        {project.category && (
          <span
            className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${project.category.color}22`,
              color: project.category.color ?? undefined,
            }}
          >
            {project.category.name}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        {project.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Sem descrição.</p>
        )}
        <p className="text-xs text-muted-foreground">Criado em {formatDateTime(project.created_at)}</p>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const { data: currentProfile } = useCurrentProfile()
  const { data: projects = [], isLoading, isError } = useProjects()
  const [dialogOpen, setDialogOpen] = useState(false)

  const canCreate = canManageProjects(currentProfile)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Frentes de trabalho associadas às categorias de Transportes."
        actions={
          canCreate ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo projeto
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState title="Erro ao carregar projetos." description="Tente recarregar a página." />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Nenhum projeto ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate ? 'Clique em "Novo projeto" para começar.' : 'Os projetos aparecerão aqui quando criados.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {currentProfile && canCreate && (
        <ProjectCreateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          createdBy={currentProfile.id}
        />
      )}
    </section>
  )
}
