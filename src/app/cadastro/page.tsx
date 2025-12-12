'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function CadastroPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function formatCPF(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  function formatPhone(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres'
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido'
    }

    const cpfDigits = formData.cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos'
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não conferem'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Corrija os erros do formulário')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          cpf: formData.cpf.replace(/\D/g, ''),
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Cadastro realizado com sucesso! Faça login para continuar.')
        router.push('/login?registered=true')
      } else {
        toast.error(result.error || 'Erro ao realizar cadastro')
        if (result.field) {
          setErrors({ [result.field]: result.error })
        }
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      toast.error('Erro ao realizar cadastro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-gray-900" />
            <span className="font-bold text-2xl text-gray-900">Unica</span>
          </Link>
          <p className="text-muted-foreground mt-2">Clube de Benefícios</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Criar Conta</CardTitle>
            <CardDescription>
              Cadastre-se gratuitamente e tenha acesso a benefícios exclusivos
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Telefone e CPF */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      maxLength={15}
                      className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    maxLength={14}
                    className={errors.cpf ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* Benefícios */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Ao se cadastrar você terá:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Acesso ao painel do assinante
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Visualização de parceiros e benefícios
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Opção de escolher o plano ideal para você
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    Criar minha conta
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-gray-900 font-medium hover:underline">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Link para ver planos */}
        <div className="text-center mt-6">
          <Link href="/planos" className="text-sm text-muted-foreground hover:text-gray-900">
            Ver planos disponíveis →
          </Link>
        </div>
      </div>
    </div>
  )
}

