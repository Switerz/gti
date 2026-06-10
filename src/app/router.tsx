import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { DashboardPage } from '@/pages/DashboardPage'
import { KPIsPage } from '@/pages/KPIsPage'
import { OKRPage } from '@/pages/OKRPage'
import { LoginPage } from '@/pages/LoginPage'
import { MyBoardPage } from '@/pages/MyBoardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { TaskListPage } from '@/pages/TaskListPage'
import { TeamBoardPage } from '@/pages/TeamBoardPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

export const router = createBrowserRouter([
  {
    // Root layout: listens to Supabase auth state changes
    element: <AuthProvider />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        // Protected zone: redirects to /login if not authenticated
        path: '/',
        element: <AuthGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'my-board', element: <MyBoardPage /> },
              { path: 'team-board', element: <TeamBoardPage /> },
              { path: 'tasks', element: <TaskListPage /> },
              { path: 'tasks/:id', element: <TaskDetailPage /> },
              { path: 'kpis', element: <KPIsPage /> },
              { path: 'projects', element: <ProjectsPage /> },
              { path: 'projects/:id', element: <ProjectDetailPage /> },
              { path: 'okrs', element: <OKRPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
