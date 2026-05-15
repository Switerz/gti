import { AlertTriangle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type ErrorStateProps = {
  title?: string
  description?: string
}

export function ErrorState({
  title = 'Nao foi possivel carregar os dados',
  description = 'Tente novamente em alguns instantes.',
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-destructive">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
