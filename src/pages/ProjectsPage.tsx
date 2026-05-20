import { useState } from 'react'

import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

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
import { useDeleteProject } from '@/hooks/useDeleteProject'
import { useProjects } from '@/hooks/useProjects'
import { formatDateTime } from '@/lib/dates'
import { canCreateProject, canDeleteProject } from '@/lib/permissions'
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

// ── Delete confirm dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  project: ProjectWithCategory | null
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

function ProjectDeleteDialog({ project, onConfirm, onCancel, isPending }: DeleteDialogProps) {
  return (
    <Dialog open={!!project} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir projeto</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{project?.name}</strong>? As tarefas associadas
            não serão apagadas, mas o projeto deixará de aparecer nas listagens.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Project card ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectWithCategory
  onDelete?: () => void
}

function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <div className="group relative">
      <Link to={`/projects/${project.id}`} className="block">
        <Card className="flex h-full flex-col transition-shadow group-hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug group-hover:text-primary">{project.name}</CardTitle>
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
      </Link>

      {onDelete && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete() }}
          aria-label={`Excluir projeto ${project.name}`}
          className="invisible absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:visible"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const { data: currentProfile } = useCurrentProfile()
  const { data: projects = [], isLoading, isError } = useProjects()
  const deleteProject = useDeleteProject()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<ProjectWithCategory | null>(null)

  const canCreate = canCreateProject(currentProfile)
  const canDelete = canDeleteProject(currentProfile)

  async function handleDeleteConfirm() {
    if (!deletingProject) return
    await deleteProject.mutateAsync(deletingProject.id)
    setDeletingProject(null)
  }

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
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={canDelete ? () => setDeletingProject(p) : undefined}
            />
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

      <ProjectDeleteDialog
        project={deletingProject}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProject(null)}
        isPending={deleteProject.isPending}
      />
    </section>
  )
}
