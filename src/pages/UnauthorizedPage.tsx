import { ShieldX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/features/auth/auth.service'

export function UnauthorizedPage() {
  async function handleSignOut() {
    await authService.signOut()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
            <ShieldX className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Acesso não autorizado</CardTitle>
            <CardDescription>Seu e-mail não está na lista de acesso.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta ferramenta é restrita a membros autorizados do GTI. Se você
            acredita que deveria ter acesso, entre em contato com o administrador.
          </p>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            Sair e tentar com outra conta
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
