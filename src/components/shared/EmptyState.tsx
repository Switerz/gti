import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
        <div>
          <p className="font-medium">{title}</p>
          {description ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
