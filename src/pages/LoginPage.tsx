import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { PackageCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/features/auth/auth.service'
import { useSession } from '@/hooks/useSession'

export function LoginPage() {
  const { data: session, isLoading } = useSession()
  const [signingIn, setSigningIn] = useState(false)

  if (!isLoading && session) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleGoogleSignIn() {
    try {
      setSigningIn(true)
      await authService.signInWithGoogle()
    } catch {
      toast.error('Erro ao iniciar login. Tente novamente.')
      setSigningIn(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">GTI</CardTitle>
            <CardDescription>Gestão de Tarefas Inteligente — equipe de Transportes</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn || isLoading}
          >
            {signingIn ? 'Redirecionando...' : 'Entrar com Google'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Acesso restrito a e-mails cadastrados na allowlist.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
