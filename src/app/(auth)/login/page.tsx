'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Mail, 
  Lock, 
  AlertCircle, 
  UserPlus,
  Sparkles,
  Gift,
  TrendingUp
} from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/app'
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Email ou senha incorretos.')
        setIsLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()

    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Branding (oculto no mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        {/* Efeitos de fundo */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              UNICA
            </h1>
            <p className="text-primary text-lg font-medium mt-1">
              Clube de Benefícios
            </p>
          </div>

          {/* Descrição */}
          <p className="text-zinc-400 text-lg mb-10 max-w-md leading-relaxed">
            Economize em cada compra com descontos exclusivos nos melhores estabelecimentos da cidade.
          </p>

          {/* Features */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-medium">Descontos Exclusivos</h3>
                <p className="text-zinc-500 text-sm">Até 50% off em parceiros selecionados</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-white font-medium">Cashback</h3>
                <p className="text-zinc-500 text-sm">Ganhe dinheiro de volta nas compras</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-white font-medium">Benefícios Premium</h3>
                <p className="text-zinc-500 text-sm">Acesso a ofertas especiais todo mês</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-zinc-800">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-zinc-500 text-sm">Parceiros</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">10k+</p>
              <p className="text-zinc-500 text-sm">Assinantes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">R$2M+</p>
              <p className="text-zinc-500 text-sm">Economia gerada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Header Mobile */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6">
              <h1 className="text-3xl font-bold tracking-tight">UNICA</h1>
              <p className="text-primary text-sm font-medium">Clube de Benefícios</p>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground mt-2">
              Entre com suas credenciais para acessar sua conta
            </p>
          </div>

          {/* Erro */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-11 h-12 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link 
                href="/esqueci-senha" 
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground">
                Novo por aqui?
              </span>
            </div>
          </div>

          {/* Cadastro */}
          <Link href="/planos" className="block">
            <Button 
              variant="outline" 
              className="w-full h-12 text-base font-medium border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Criar minha conta
            </Button>
          </Link>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            Ao continuar, você concorda com nossos{' '}
            <Link href="/termos" className="text-primary hover:underline">
              Termos de Uso
            </Link>
            {' '}e{' '}
            <Link href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      </div>
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
