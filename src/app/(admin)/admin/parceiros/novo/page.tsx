'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  Building2,
  Plus,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateCategoryModal } from '@/components/admin/create-category-modal'

interface Category {
  id: string
  name: string
  slug: string
}

export default function NovoParceiroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Estados do formulário
  const [formData, setFormData] = useState({
    tradeName: '',
    document: '',
    categoryId: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Estados auxiliares
  const [categories, setCategories] = useState<Category[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.data || data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Formatar CNPJ/CPF
  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '')

    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value)
    setFormData(prev => ({ ...prev, document: formatted }))
  }

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
    setFormData(prev => ({ ...prev, categoryId: newCategory.id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.tradeName.trim()) {
      toast.error('Nome Fantasia é obrigatório')
      return
    }

    if (!formData.document.trim()) {
      toast.error('CNPJ ou CPF é obrigatório')
      return
    }

    if (!formData.categoryId) {
      toast.error('Categoria é obrigatória')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      return
    }

    if (!formData.password) {
      toast.error('Senha é obrigatória')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      const documentNumbers = formData.document.replace(/\D/g, '')

      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeName: formData.tradeName.trim(),
          companyName: formData.tradeName.trim(), // Usar tradeName como companyName inicialmente
          cnpj: documentNumbers,
          categoryId: formData.categoryId,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar parceiro')
      }

      const newPartner = await response.json()

      toast.success('Parceiro criado com sucesso! Complete os dados.')

      // Redirecionar para página de edição
      router.push(`/admin/parceiros/${newPartner.id || newPartner.data?.id}/editar`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar parceiro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/parceiros">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Parceiro</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre os dados básicos. Após criar, complete as informações.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados do Parceiro
            </CardTitle>
            <CardDescription>
              Preencha apenas os dados essenciais. Após criar, você poderá adicionar imagens, endereço, benefícios e mais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome Fantasia */}
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia *</Label>
              <Input
                id="tradeName"
                name="tradeName"
                value={formData.tradeName}
                onChange={handleChange}
                placeholder="Nome da empresa"
                className="h-11"
                autoFocus
              />
            </div>

            {/* CNPJ/CPF e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document">CNPJ ou CPF *</Label>
                <Input
                  id="document"
                  name="document"
                  value={formData.document}
                  onChange={handleDocumentChange}
                  placeholder="00.000.000/0000-00"
                  className="h-11"
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleSelectChange('categoryId', value)}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger className="flex-1 h-11">
                      <SelectValue placeholder={loadingCategories ? 'Carregando...' : 'Selecione...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCategoryModal(true)}
                    className="h-11 w-11 flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Dados de Acesso
              </h3>

              {/* Email */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="email">Email de Acesso *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="parceiro@email.com"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Este email será usado para login no app do parceiro
                </p>
              </div>

              {/* Senhas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      className="h-11 pr-10"
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
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repita a senha"
                      className="h-11 pr-10"
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/parceiros">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Criar Parceiro
          </Button>
        </div>
      </form>

      {/* Modal de Categoria */}
      <CreateCategoryModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        onSuccess={handleCategoryCreated}
      />
    </div>
  )
}
