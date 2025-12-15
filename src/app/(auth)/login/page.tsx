'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Mail, 
  Lock, 
  AlertCircle,
  Gift
} from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/app'
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log('[LOGIN] Tentando login com:', formData.email)
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      console.log('[LOGIN] Resultado:', result)

      if (result?.error) {
        console.log('[LOGIN] Erro:', result.error)
        setError('Email ou senha incorretos.')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        console.log('[LOGIN] Sucesso! Redirecionando para:', callbackUrl)
        // Usar window.location para garantir redirecionamento
        window.location.href = callbackUrl || '/app'
        return
      }

      // Se chegou aqui, algo deu errado
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)

    } catch (error) {
      console.error('[LOGIN] Exceção:', error)
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Gift className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold">UNICA</span>
          </div>
          <p className="text-muted-foreground">Clube de Benefícios</p>
        </div>

        {/* Card de Login */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>Acesse sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-12"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 h-12"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/recuperar-senha" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Cadastre-se */}
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-muted-foreground mb-3">Ainda não tem conta?</p>
              <Link href="/planos">
                <Button variant="outline" className="w-full">
                  <Gift className="mr-2 h-4 w-4" />
                  Cadastre-se
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos{' '}
          <Link href="/termos" className="underline hover:text-foreground">Termos de Uso</Link>
          {' '}e{' '}
          <Link href="/privacidade" className="underline hover:text-foreground">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  )
}
