'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  User,
  Store,
  Shield,
  Gift,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('[LOGIN] Tentando login com:', { email, passwordLength: password?.length })

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      console.log('[LOGIN] Resultado do signIn:', result)

      if (result?.error) {
        console.log('[LOGIN] Erro retornado:', result.error)
        setError('Email ou senha incorretos')
        setIsLoading(false)
        return
      }

      // Buscar sessao para obter role
      const session = await fetch('/api/auth/session').then(r => r.json())

      // Redirecionar baseado no role
      let redirectUrl = '/app'

      if (session?.user?.role) {
        switch (session.user.role) {
          case 'DEVELOPER':
            redirectUrl = '/developer'
            break
          case 'ADMIN':
            redirectUrl = '/admin'
            break
          case 'PARCEIRO':
            redirectUrl = '/parceiro'
            break
          case 'ASSINANTE':
          default:
            redirectUrl = '/app'
            break
        }
      }

      // Verificar callbackUrl se existir e usuario tiver permissao
      if (callbackUrl) {
        const canAccess =
          (callbackUrl.startsWith('/admin') && ['ADMIN', 'DEVELOPER'].includes(session?.user?.role)) ||
          (callbackUrl.startsWith('/developer') && session?.user?.role === 'DEVELOPER') ||
          (callbackUrl.startsWith('/parceiro') && ['PARCEIRO', 'DEVELOPER'].includes(session?.user?.role)) ||
          (callbackUrl.startsWith('/app'))

        if (canAccess) {
          redirectUrl = callbackUrl
        }
      }

      toast.success('Login realizado com sucesso!')
      router.push(redirectUrl)
      router.refresh()

    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Branding (apenas desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-12 flex-col justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-zinc-900 font-bold text-xl">U</span>
            </div>
            <span className="text-2xl font-bold">UNICA</span>
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">
              Bem-vindo de volta!
            </h1>
            <p className="text-xl text-zinc-400">
              Acesse sua conta e aproveite todos os beneficios exclusivos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <Gift className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Descontos</h3>
              <p className="text-sm text-zinc-400">Ate 50% em parceiros</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <TrendingUp className="h-8 w-8 text-green-400 mb-3" />
              <h3 className="font-semibold mb-1">Cashback</h3>
              <p className="text-sm text-zinc-400">Dinheiro de volta</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <Shield className="h-4 w-4" />
          <span>Seus dados estao protegidos</span>
        </div>
      </div>

      {/* Lado Direito - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">U</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold mt-4">UNICA</h1>
            <p className="text-muted-foreground">Clube de Beneficios</p>
          </div>

          {/* Card de Login */}
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>
                Acesse sua conta para continuar
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="/recuperar-senha" className="text-xs text-primary hover:underline">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Ainda nao tem conta?
                  </span>
                </div>
              </div>

              {/* Botoes de Cadastro */}
              <div className="space-y-3">
                <Link href="/cadastro" className="block">
                  <Button variant="outline" className="w-full h-12 justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Seja um Assinante</div>
                        <div className="text-xs text-muted-foreground">Economize com descontos exclusivos</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </Link>

                <Link href="/interesse-parceiro" className="block">
                  <Button variant="outline" className="w-full h-12 justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                        <Store className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Seja um Parceiro</div>
                        <div className="text-xs text-muted-foreground">Aumente suas vendas conosco</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao entrar, voce concorda com nossos{' '}
            <Link href="/termos" className="text-primary hover:underline">Termos</Link>
            {' '}e{' '}
            <Link href="/privacidade" className="text-primary hover:underline">Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
