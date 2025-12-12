'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

// Schema para cadastro de Assinante
const assinanteSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido').max(11, 'Telefone inválido'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

// Schema para cadastro de Parceiro
const parceiroSchema = z.object({
  companyName: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  tradeName: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido').max(11, 'Telefone inválido'),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type AssinanteFormData = z.infer<typeof assinanteSchema>
type ParceiroFormData = z.infer<typeof parceiroSchema>

function CadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo')
  
  const [activeTab, setActiveTab] = useState<string>(tipo === 'parceiro' ? 'parceiro' : 'assinante')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form de Assinante
  const assinanteForm = useForm<AssinanteFormData>({
    resolver: zodResolver(assinanteSchema),
  })

  // Form de Parceiro
  const parceiroForm = useForm<ParceiroFormData>({
    resolver: zodResolver(parceiroSchema),
  })

  async function onSubmitAssinante(data: AssinanteFormData) {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          cpf: data.cpf,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Cadastro realizado com sucesso!')
        router.push('/login?registered=true')
      } else {
        toast.error(result.error || 'Erro ao realizar cadastro')
      }
    } catch {
      toast.error('Ocorreu um erro ao realizar cadastro')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmitParceiro(data: ParceiroFormData) {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register/parceiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Cadastro realizado! Aguarde aprovação.')
        router.push('/login')
      } else {
        toast.error(result.error || 'Erro ao realizar cadastro')
      }
    } catch {
      toast.error('Ocorreu um erro ao realizar cadastro')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para formatar CPF enquanto digita
  function formatCPF(value: string) {
    return value.replace(/\D/g, '').slice(0, 11)
  }

  // Função para formatar CNPJ enquanto digita
  function formatCNPJ(value: string) {
    return value.replace(/\D/g, '').slice(0, 14)
  }

  // Função para formatar telefone enquanto digita
  function formatPhone(value: string) {
    return value.replace(/\D/g, '').slice(0, 11)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="assinante" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Assinante
        </TabsTrigger>
        <TabsTrigger value="parceiro" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Parceiro
        </TabsTrigger>
      </TabsList>

      {/* Formulário de Assinante */}
      <TabsContent value="assinante">
        <form onSubmit={assinanteForm.handleSubmit(onSubmitAssinante)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Seu nome completo"
                className="pl-10"
                disabled={isLoading}
                {...assinanteForm.register('name')}
              />
            </div>
            {assinanteForm.formState.errors.name && (
              <p className="text-sm text-destructive">{assinanteForm.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email-assinante">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email-assinante"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                disabled={isLoading}
                {...assinanteForm.register('email')}
              />
            </div>
            {assinanteForm.formState.errors.email && (
              <p className="text-sm text-destructive">{assinanteForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone-assinante">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone-assinante"
                  placeholder="11999999999"
                  className="pl-10"
                  disabled={isLoading}
                  {...assinanteForm.register('phone', {
                    onChange: (e) => {
                      e.target.value = formatPhone(e.target.value)
                    }
                  })}
                />
              </div>
              {assinanteForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{assinanteForm.formState.errors.phone.message}</p>
              )}
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="00000000000"
                disabled={isLoading}
                {...assinanteForm.register('cpf', {
                  onChange: (e) => {
                    e.target.value = formatCPF(e.target.value)
                  }
                })}
              />
              {assinanteForm.formState.errors.cpf && (
                <p className="text-sm text-destructive">{assinanteForm.formState.errors.cpf.message}</p>
              )}
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password-assinante">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password-assinante"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                disabled={isLoading}
                {...assinanteForm.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {assinanteForm.formState.errors.password && (
              <p className="text-sm text-destructive">{assinanteForm.formState.errors.password.message}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword-assinante">Confirmar senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword-assinante"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10"
                disabled={isLoading}
                {...assinanteForm.register('confirmPassword')}
              />
            </div>
            {assinanteForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{assinanteForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>
      </TabsContent>

      {/* Formulário de Parceiro - Em breve */}
      <TabsContent value="parceiro">
        <div className="text-center py-8 space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg">Cadastro de Parceiros</h3>
            <p className="text-muted-foreground">
              Em breve você poderá se cadastrar como parceiro do Unica Clube de Benefícios.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Para se tornar um parceiro agora, entre em contato com nossa equipe.
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:contato@unica.club">
              Entrar em contato
            </a>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function CadastroFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 mb-6">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
        <CardDescription>
          Escolha o tipo de conta e preencha seus dados
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense fallback={<CadastroFormSkeleton />}>
          <CadastroForm />
        </Suspense>
      </CardContent>

      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Fazer login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
