'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  AlertCircle,
  MessageCircle,
  CreditCard,
  Gift,
  CheckCircle
} from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/app'
  
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'assinante' | 'parceiro'>('assinante')
  const [error, setError] = useState<string | null>(null)
  const [subscriptionError, setSubscriptionError] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('5566999999999')
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/public/config')
      const data = await response.json()
      if (data.config?.whatsapp) {
        setWhatsappNumber(data.config.whatsapp)
      }
    } catch (error) {
      console.error('Erro ao buscar config:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSubscriptionError(false)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        // Verificar se é erro de assinatura
        if (result.error.includes('assinatura') || result.error.includes('inativ') || result.error.includes('cancelad')) {
          setSubscriptionError(true)
          setError(result.error)
        } else if (result.error.includes('Credenciais') || result.error === 'CredentialsSignin') {
          setError('Email ou senha incorretos.')
        } else {
          setError(result.error)
        }
        setIsLoading(false)
        return
      }

      // Aguardar sessão
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirecionar baseado no tipo de login
      if (activeTab === 'parceiro') {
        window.location.href = '/parceiro'
      } else {
        window.location.href = callbackUrl
      }

    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Olá! Tenho interesse em ser um parceiro do UNICA Clube de Benefícios.')
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Branding (apenas desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <span className="text-3xl font-bold text-white">UNICA</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Seu Clube de<br />
            <span className="text-white/90">Benefícios Exclusivos</span>
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Acesse descontos e vantagens em centenas de parceiros. 
            Economize em cada compra com sua assinatura.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <CheckCircle className="h-5 w-5 text-green-300" />
            <span>Descontos exclusivos em parceiros</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <CheckCircle className="h-5 w-5 text-green-300" />
            <span>Cashback em compras selecionadas</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <CheckCircle className="h-5 w-5 text-green-300" />
            <span>Acumule pontos e troque por prêmios</span>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">UNICA</span>
            </div>
            <p className="text-muted-foreground">Clube de Benefícios</p>
          </div>

          {/* Tabs Assinante/Parceiro */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assinante' | 'parceiro')}>
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="assinante" className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Assinante
              </TabsTrigger>
              <TabsTrigger value="parceiro" className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                Parceiro
              </TabsTrigger>
            </TabsList>

            {/* Tab Assinante */}
            <TabsContent value="assinante" className="mt-6">
              <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-0 sm:px-6">
                  <CardTitle className="text-2xl">Entrar</CardTitle>
                  <CardDescription>
                    Acesse sua conta de assinante
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Erro de Assinatura */}
                    {subscriptionError && (
                      <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">
                          <p className="font-medium">{error}</p>
                          <Link href="/planos">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Refazer Assinatura
                            </Button>
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Erro Genérico */}
                    {error && !subscriptionError && (
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
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link 
                        href="/recuperar-senha" 
                        className="text-sm text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base"
                      disabled={isLoading}
                    >
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

                  {/* Cadastrar */}
                  <div className="mt-6 text-center">
                    <p className="text-muted-foreground">
                      Ainda não tem conta?
                    </p>
                    <Link href="/planos">
                      <Button variant="outline" className="mt-2 w-full">
                        <Gift className="mr-2 h-4 w-4" />
                        Cadastre-se - Ver Planos
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Parceiro */}
            <TabsContent value="parceiro" className="mt-6">
              <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-0 sm:px-6">
                  <CardTitle className="text-2xl">Área do Parceiro</CardTitle>
                  <CardDescription>
                    Acesse o painel da sua empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && !subscriptionError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email-parceiro">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-parceiro"
                          type="email"
                          placeholder="contato@empresa.com"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-parceiro">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password-parceiro"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        'Entrar como Parceiro'
                      )}
                    </Button>
                  </form>

                  {/* Quero ser Parceiro */}
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-center text-muted-foreground mb-3">
                      Quer ser um parceiro UNICA?
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                      onClick={handleWhatsAppContact}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Entrar em Contato
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Fale conosco pelo WhatsApp para fazer parceria
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{' '}
            <Link href="/termos" className="underline hover:text-foreground">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="underline hover:text-foreground">
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
