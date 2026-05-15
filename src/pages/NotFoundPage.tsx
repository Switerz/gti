import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-8xl font-bold text-muted-foreground/20">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-sm text-muted-foreground">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <Button asChild>
        <Link to="/dashboard">← Voltar ao Dashboard</Link>
      </Button>
    </div>
  )
}
