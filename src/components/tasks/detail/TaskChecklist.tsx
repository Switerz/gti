import { useState } from 'react'

import { CheckSquare, Pencil, Plus, Save, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useTaskChecklist,
  useToggleChecklistItem,
  useUpdateChecklistItem,
} from '@/hooks/useTaskChecklist'

interface Props {
  taskId: string
  currentProfileId: string
}

export function TaskChecklist({ taskId, currentProfileId }: Props) {
  const { data: items = [], isLoading } = useTaskChecklist(taskId)
  const createItem = useCreateChecklistItem(taskId)
  const toggleItem = useToggleChecklistItem(taskId)
  const updateItem = useUpdateChecklistItem(taskId)
  const deleteItem = useDeleteChecklistItem(taskId)

  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const done = items.filter((i) => i.is_done).length
  const total = items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    await createItem.mutateAsync({ title, position: items.length, actorId: currentProfileId })
    setNewTitle('')
    setAdding(false)
  }

  function startEditing(id: string, title: string) {
    setEditingId(id)
    setEditingTitle(title)
    setAdding(false)
    setNewTitle('')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingTitle('')
  }

  async function handleUpdate(id: string, currentTitle: string) {
    const title = editingTitle.trim()
    if (!title) return
    if (title === currentTitle) {
      cancelEditing()
      return
    }

    await updateItem.mutateAsync({ id, title, actorId: currentProfileId })
    cancelEditing()
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Checklist</h3>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">
              {done}/{total}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar
        </Button>
      </div>

      {total > 0 && (
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do checklist"
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-6 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-2">
              <Checkbox
                checked={item.is_done}
                aria-label={item.title}
                disabled={editingId === item.id}
                onCheckedChange={(checked) =>
                  toggleItem.mutate({ id: item.id, isDone: !!checked, actorId: currentProfileId })
                }
              />
              {editingId === item.id ? (
                <>
                  <Input
                    autoFocus
                    aria-label={`Editar ${item.title}`}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(item.id, item.title)
                      if (e.key === 'Escape') cancelEditing()
                    }}
                    className="h-8 flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Salvar ${item.title}`}
                    onClick={() => handleUpdate(item.id, item.title)}
                    disabled={!editingTitle.trim() || updateItem.isPending}
                    className="h-8 w-8"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Cancelar edicao de ${item.title}`}
                    onClick={cancelEditing}
                    className="h-8 w-8"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span
                    className={
                      item.is_done
                        ? 'flex-1 text-sm line-through text-muted-foreground'
                        : 'flex-1 text-sm'
                    }
                  >
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditing(item.id, item.title)}
                    aria-label={`Editar ${item.title}`}
                    className="invisible text-muted-foreground hover:text-foreground group-hover:visible focus:visible"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem.mutate(item.id)}
                    aria-label={`Excluir ${item.title}`}
                    className="invisible text-muted-foreground hover:text-destructive group-hover:visible focus:visible"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            placeholder="Novo item..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
            }}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleAdd} disabled={createItem.isPending}>
            Salvar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setAdding(false); setNewTitle('') }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </section>
  )
}
