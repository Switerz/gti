import { Loader2 } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  /** Use true for full-page centered spinner (AuthGuard, TaskDetailPage) */
  fullPage?: boolean
}

export function LoadingState({ fullPage }: LoadingStateProps) {
  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-lg" />
      ))}
    </div>
  )
}
