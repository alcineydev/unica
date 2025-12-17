'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  Mail, 
  Lock, 
  AlertCircle, 
  User,
  Phone,
  Building2,
  MapPin,
  Sparkles,
  Gift,
  TrendingUp,
  CheckCircle,
  LogIn,
  UserPlus,
  Handshake
} from 'lucide-react'
import { toast } from 'sonner'

// Função para formatar telefone
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') || 'entrar'
  
  const [activeTab, setActiveTab] = useState(tabParam)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [cadastroForm, setCadastroForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: ''
  })
  const [parceiroForm, setParceiroForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    nomeEmpresa: '',
    cidade: ''
  })

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false
      })

      if (result?.error) {
        setError('Email ou senha incorretos.')
        setIsLoading(false)
        return
      }

      // Buscar sessão para obter o role
      const session = await fetch('/api/auth/session').then(r => r.json())
      
      // Redirecionar baseado no role
      let redirectUrl = '/app' // default para assinante
      
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
      
      // Se tinha callbackUrl específico E o usuário tem permissão, usa ele
      const requestedUrl = searchParams.get('callbackUrl')
      if (requestedUrl && session?.user?.role) {
        const role = session.user.role
        const canAccess = 
          (requestedUrl.startsWith('/admin') && ['ADMIN', 'DEVELOPER'].includes(role)) ||
          (requestedUrl.startsWith('/developer') && role === 'DEVELOPER') ||
          (requestedUrl.startsWith('/parceiro') && role === 'PARCEIRO') ||
          (requestedUrl.startsWith('/app') && role === 'ASSINANTE')
        
        if (canAccess) {
          redirectUrl = requestedUrl
        }
      }

      router.push(redirectUrl)
      router.refresh()

    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  // CADASTRO ASSINANTE
  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (cadastroForm.password !== cadastroForm.confirmPassword) {
      setError('As senhas não coincidem.')
      setIsLoading(false)
      return
    }

    if (cadastroForm.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/public/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cadastroForm.nome,
          email: cadastroForm.email,
          phone: cadastroForm.telefone.replace(/\D/g, ''),
          password: cadastroForm.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta.')
        setIsLoading(false)
        return
      }

      toast.success('Conta criada com sucesso!')
      
      // Fazer login automático
      const result = await signIn('credentials', {
        email: cadastroForm.email,
        password: cadastroForm.password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/planos')
      } else {
        setActiveTab('entrar')
        setSuccess('Conta criada! Faça login para continuar.')
      }

    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // INTERESSE PARCEIRO
  const handleParceiro = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/public/interesse-parceiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: parceiroForm.nome,
          email: parceiroForm.email,
          telefone: parceiroForm.telefone.replace(/\D/g, ''),
          nomeEmpresa: parceiroForm.nomeEmpresa,
          cidade: parceiroForm.cidade
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar interesse.')
        setIsLoading(false)
        return
      }

      toast.success('Interesse enviado com sucesso!')
      setSuccess('Recebemos seu interesse! Entraremos em contato em breve.')
      setParceiroForm({ nome: '', email: '', telefone: '', nomeEmpresa: '', cidade: '' })

    } catch (err) {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white tracking-tight">UNICA</h1>
            <p className="text-primary text-lg font-medium mt-1">Clube de Benefícios</p>
          </div>

          <p className="text-zinc-400 text-lg mb-10 max-w-md leading-relaxed">
            Economize em cada compra com descontos exclusivos nos melhores estabelecimentos da cidade.
          </p>

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
              <p className="text-zinc-500 text-sm">Economia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Header Mobile */}
          <div className="text-center lg:hidden mb-4">
            <h1 className="text-3xl font-bold tracking-tight">UNICA</h1>
            <p className="text-primary text-sm font-medium">Clube de Benefícios</p>
          </div>

          {/* Alertas */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(null); setSuccess(null); }} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="entrar" className="text-sm">
                <LogIn className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="cadastro" className="text-sm">
                <UserPlus className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Cadastre-se
              </TabsTrigger>
              <TabsTrigger value="parceiro" className="text-sm">
                <Handshake className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Parceiro
              </TabsTrigger>
            </TabsList>

            {/* TAB ENTRAR */}
            <TabsContent value="entrar" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Bem-vindo de volta</h2>
                <p className="text-muted-foreground text-sm">Entre com suas credenciais</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 h-11"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/esqueci-senha" className="text-sm text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            {/* TAB CADASTRO */}
            <TabsContent value="cadastro" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Criar conta</h2>
                <p className="text-muted-foreground text-sm">Comece a economizar hoje mesmo</p>
              </div>

              <form onSubmit={handleCadastro} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cad-nome">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cad-nome"
                      placeholder="Seu nome"
                      className="pl-10 h-11"
                      value={cadastroForm.nome}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, nome: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cad-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cad-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 h-11"
                      value={cadastroForm.email}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cad-telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cad-telefone"
                      placeholder="(00) 00000-0000"
                      className="pl-10 h-11"
                      value={cadastroForm.telefone}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, telefone: formatPhone(e.target.value) })}
                      maxLength={15}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cad-password">Senha</Label>
                    <Input
                      id="cad-password"
                      type="password"
                      placeholder="••••••"
                      className="h-11"
                      value={cadastroForm.password}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, password: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cad-confirm">Confirmar</Label>
                    <Input
                      id="cad-confirm"
                      type="password"
                      placeholder="••••••"
                      className="h-11"
                      value={cadastroForm.confirmPassword}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, confirmPassword: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar minha conta
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao criar conta, você concorda com nossos{' '}
                  <Link href="/termos" className="text-primary hover:underline">Termos</Link>
                </p>
              </form>
            </TabsContent>

            {/* TAB PARCEIRO */}
            <TabsContent value="parceiro" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Seja um Parceiro</h2>
                <p className="text-muted-foreground text-sm">Aumente suas vendas com a UNICA</p>
              </div>

              <form onSubmit={handleParceiro} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="parc-nome">Seu nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="parc-nome"
                        placeholder="Nome"
                        className="pl-10 h-11"
                        value={parceiroForm.nome}
                        onChange={(e) => setParceiroForm({ ...parceiroForm, nome: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parc-telefone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="parc-telefone"
                        placeholder="(00) 00000-0000"
                        className="pl-10 h-11"
                        value={parceiroForm.telefone}
                        onChange={(e) => setParceiroForm({ ...parceiroForm, telefone: formatPhone(e.target.value) })}
                        maxLength={15}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parc-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="parc-email"
                      type="email"
                      placeholder="contato@empresa.com"
                      className="pl-10 h-11"
                      value={parceiroForm.email}
                      onChange={(e) => setParceiroForm({ ...parceiroForm, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parc-empresa">Nome da Empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="parc-empresa"
                      placeholder="Nome da sua empresa"
                      className="pl-10 h-11"
                      value={parceiroForm.nomeEmpresa}
                      onChange={(e) => setParceiroForm({ ...parceiroForm, nomeEmpresa: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parc-cidade">Cidade</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="parc-cidade"
                      placeholder="Sua cidade"
                      className="pl-10 h-11"
                      value={parceiroForm.cidade}
                      onChange={(e) => setParceiroForm({ ...parceiroForm, cidade: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Enviar interesse
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Nossa equipe entrará em contato em até 48h
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
