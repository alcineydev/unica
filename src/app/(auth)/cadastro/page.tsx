'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle,
  Gift,
  Percent,
  Store
} from 'lucide-react'
import { toast } from 'sonner'

function CadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plano')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState(1) // 1 = dados pessoais, 2 = endereco, 3 = senha

  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    senha: '',
    confirmarSenha: ''
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Mascaras
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  // Buscar endereco por CEP
  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validacoes
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas nao coincidem')
      return
    }

    const cpfLimpo = formData.cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setError('CPF invalido')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/public/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone.replace(/\D/g, ''),
          cpf: cpfLimpo,
          password: formData.senha
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
        setIsLoading(false)
        return
      }

      // Login automatico
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.senha,
        redirect: false
      })

      if (result?.ok) {
        toast.success('Conta criada com sucesso!')
        router.push(planId ? `/checkout?plano=${planId}` : '/planos')
      } else {
        toast.success('Conta criada! Faca login para continuar.')
        router.push('/login')
      }

    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para login
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Lado Esquerdo - Beneficios */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <h1 className="text-4xl font-bold mb-4">
                Junte-se ao <span className="text-primary">UNICA</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Acesse descontos exclusivos em centenas de estabelecimentos parceiros.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Percent className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Descontos de ate 50%</h3>
                    <p className="text-muted-foreground text-sm">
                      Em restaurantes, lojas, servicos e muito mais.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center shrink-0">
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Cashback em compras</h3>
                    <p className="text-muted-foreground text-sm">
                      Receba parte do seu dinheiro de volta a cada compra.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">500+ Parceiros</h3>
                    <p className="text-muted-foreground text-sm">
                      Rede crescente de estabelecimentos na sua cidade.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">Cadastro rapido e gratuito</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Crie sua conta em menos de 2 minutos e escolha o plano ideal para voce.
                </p>
              </div>
            </div>
          </div>

          {/* Lado Direito - Formulario */}
          <div>
            <Card className="shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Criar sua conta</CardTitle>
                <CardDescription>
                  Preencha seus dados para comecar a economizar
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= s
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {s}
                      </div>
                      {s < 3 && (
                        <div className={`w-12 h-1 mx-1 rounded ${
                          step > s ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Step 1: Dados Pessoais */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="nome"
                            placeholder="Seu nome completo"
                            className="pl-10 h-11"
                            value={formData.nome}
                            onChange={(e) => updateField('nome', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10 h-11"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cpf">CPF</Label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="cpf"
                              placeholder="000.000.000-00"
                              className="pl-10 h-11"
                              value={formData.cpf}
                              onChange={(e) => updateField('cpf', maskCPF(e.target.value))}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="telefone"
                              placeholder="(00) 00000-0000"
                              className="pl-10 h-11"
                              value={formData.telefone}
                              onChange={(e) => updateField('telefone', maskPhone(e.target.value))}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento">Data de Nascimento (opcional)</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="dataNascimento"
                            type="date"
                            className="pl-10 h-11"
                            value={formData.dataNascimento}
                            onChange={(e) => updateField('dataNascimento', e.target.value)}
                          />
                        </div>
                      </div>

                      {error && step === 1 && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                          {error}
                        </div>
                      )}

                      <Button
                        type="button"
                        className="w-full h-11 mt-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900"
                        onClick={() => {
                          if (!formData.nome || !formData.email || !formData.cpf || !formData.telefone) {
                            setError('Preencha todos os campos obrigatorios')
                            return
                          }
                          setError(null)
                          setStep(2)
                        }}
                      >
                        Continuar
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Endereco */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP (opcional)</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="cep"
                            placeholder="00000-000"
                            className="pl-10 h-11"
                            value={formData.cep}
                            onChange={(e) => {
                              const masked = maskCEP(e.target.value)
                              updateField('cep', masked)
                              if (masked.replace(/\D/g, '').length === 8) {
                                buscarCEP(masked)
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="endereco">Endereco</Label>
                          <Input
                            id="endereco"
                            placeholder="Rua, Avenida..."
                            className="h-11"
                            value={formData.endereco}
                            onChange={(e) => updateField('endereco', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numero">Numero</Label>
                          <Input
                            id="numero"
                            placeholder="123"
                            className="h-11"
                            value={formData.numero}
                            onChange={(e) => updateField('numero', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complemento">Complemento (opcional)</Label>
                        <Input
                          id="complemento"
                          placeholder="Apto, Bloco..."
                          className="h-11"
                          value={formData.complemento}
                          onChange={(e) => updateField('complemento', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bairro">Bairro</Label>
                          <Input
                            id="bairro"
                            placeholder="Bairro"
                            className="h-11"
                            value={formData.bairro}
                            onChange={(e) => updateField('bairro', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input
                            id="cidade"
                            placeholder="Cidade"
                            className="h-11"
                            value={formData.cidade}
                            onChange={(e) => updateField('cidade', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">UF</Label>
                          <Input
                            id="estado"
                            placeholder="UF"
                            className="h-11"
                            maxLength={2}
                            value={formData.estado}
                            onChange={(e) => updateField('estado', e.target.value.toUpperCase())}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-11"
                          onClick={() => setStep(1)}
                        >
                          Voltar
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 h-11 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900"
                          onClick={() => setStep(3)}
                        >
                          Continuar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Senha */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="senha">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="senha"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Minimo 6 caracteres"
                            className="pl-10 pr-10 h-11"
                            value={formData.senha}
                            onChange={(e) => updateField('senha', e.target.value)}
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmarSenha"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Repita a senha"
                            className="pl-10 pr-10 h-11"
                            value={formData.confirmarSenha}
                            onChange={(e) => updateField('confirmarSenha', e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-11"
                          onClick={() => setStep(2)}
                          disabled={isLoading}
                        >
                          Voltar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 h-11 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Criando conta...
                            </>
                          ) : (
                            'Criar minha conta'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Ja tem uma conta?{' '}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Fazer login
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
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

export default function CadastroPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CadastroForm />
    </Suspense>
  )
}
