'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        {/* Padrão de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-brand-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="text-2xl font-bold">UNICA</span>
            </Link>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Bem-vindo de volta!
              </h1>
              <p className="text-slate-400 text-lg mt-4 max-w-md">
                Acesse sua conta e aproveite todos os benefícios exclusivos do clube.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center mb-3">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">Descontos</h3>
                <p className="text-slate-400 text-sm mt-1">Até 50% em parceiros</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">Cashback</h3>
                <p className="text-slate-400 text-sm mt-1">Dinheiro de volta</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Seus dados estão protegidos</span>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="text-slate-900 text-2xl font-bold">UNICA</span>
            </div>
          </div>

          {/* Card de Login */}
          <Card className="shadow-xl border-0 rounded-3xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-slate-900">Entrar</CardTitle>
              <CardDescription className="text-slate-500">
                Acesse sua conta para continuar
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Senha</label>
                    <Link
                      href="/recuperar-senha"
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-medium py-3 px-6 rounded-xl shadow-sm hover:from-brand-700 hover:to-brand-800 hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 border-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
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

              {/* Links de Cadastro */}
              <div className="space-y-3">
                <Link href="/planos" className="block">
                  <div className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900">Seja um Assinante</div>
                        <div className="text-xs text-slate-500">Economize com descontos exclusivos</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

                <Link href="/interesse-parceiro" className="block">
                  <div className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-warning-300 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-warning-100 rounded-xl flex items-center justify-center">
                        <Store className="w-5 h-5 text-warning-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900">Seja um Parceiro</div>
                        <div className="text-xs text-slate-500">Aumente suas vendas conosco</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-warning-600 group-hover:translate-x-1 transition-all" />
                  </div>
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
