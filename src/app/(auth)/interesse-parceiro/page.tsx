'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Store,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Loader2,
  CheckCircle,
  TrendingUp,
  Users,
  Megaphone
} from 'lucide-react'
import { toast } from 'sonner'

export default function InteresseParceiroPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    nomeEmpresa: '',
    cidade: '',
    mensagem: ''
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/public/interesse-parceiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          telefone: formData.telefone.replace(/\D/g, '')
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao enviar interesse')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      toast.success('Interesse enviado com sucesso!')

    } catch (err) {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
        <Card className="max-w-md w-full text-center shadow-xl">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Interesse Enviado!</h1>
            <p className="text-muted-foreground mb-6">
              Recebemos seu interesse em ser um parceiro UNICA. Nossa equipe entrara em contato em breve.
            </p>
            <Link href="/login">
              <Button className="w-full">Voltar para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
                Seja um <span className="text-primary">Parceiro</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Aumente suas vendas e fidelize clientes com o UNICA Clube de Beneficios.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Aumente suas vendas</h3>
                    <p className="text-muted-foreground text-sm">
                      Clientes com beneficios compram mais e com mais frequencia.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Novos clientes</h3>
                    <p className="text-muted-foreground text-sm">
                      Acesso a milhares de assinantes buscando parceiros.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center shrink-0">
                    <Megaphone className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Marketing gratuito</h3>
                    <p className="text-muted-foreground text-sm">
                      Sua empresa divulgada no app e nas redes sociais.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Parceiros</div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                  <div className="text-3xl font-bold text-primary">10k+</div>
                  <div className="text-sm text-muted-foreground">Assinantes</div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                  <div className="text-3xl font-bold text-primary">R$2M+</div>
                  <div className="text-sm text-muted-foreground">Em vendas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito - Formulario */}
          <div>
            <Card className="shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl">Quero ser Parceiro</CardTitle>
                <CardDescription>
                  Preencha seus dados e entraremos em contato
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Seu nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome"
                        placeholder="Nome completo"
                        className="pl-10 h-11"
                        value={formData.nome}
                        onChange={(e) => updateField('nome', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nomeEmpresa"
                        placeholder="Nome do estabelecimento"
                        className="pl-10 h-11"
                        value={formData.nomeEmpresa}
                        onChange={(e) => updateField('nomeEmpresa', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cidade"
                        placeholder="Sua cidade"
                        className="pl-10 h-11"
                        value={formData.cidade}
                        onChange={(e) => updateField('cidade', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem">Mensagem (opcional)</Label>
                    <Textarea
                      id="mensagem"
                      placeholder="Conte um pouco sobre seu negocio..."
                      rows={3}
                      value={formData.mensagem}
                      onChange={(e) => updateField('mensagem', e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 mt-4" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Interesse'
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Ja e parceiro?{' '}
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
