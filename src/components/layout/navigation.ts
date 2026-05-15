import {
  FolderKanban,
  Home,
  LayoutDashboard,
  ListChecks,
  Settings,
  UsersRound,
} from 'lucide-react'

import type { NavigationItem } from '@/types/domain'

export const mainNavigation: NavigationItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Meu Kanban', href: '/my-board', icon: Home },
  { title: 'Kanban da Equipe', shortTitle: 'Equipe', href: '/team-board', icon: UsersRound },
  { title: 'Lista de Tarefas', shortTitle: 'Tarefas', href: '/tasks', icon: ListChecks },
  { title: 'Projetos', href: '/projects', icon: FolderKanban },
  { title: 'Configurações', href: '/settings', icon: Settings },
]
