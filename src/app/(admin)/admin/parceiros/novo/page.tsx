'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/ui/image-upload'
import { GalleryUpload } from '@/components/ui/gallery-upload'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PARTNER_CATEGORIES } from '@/constants'

const partnerSchema = z.object({
  companyName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tradeName: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().optional(),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  description: z.string().optional(),
  category: z.string().min(1, 'Selecione uma categoria'),
  cityId: z.string().min(1, 'Selecione uma cidade'),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  complement: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
})

type PartnerFormData = z.infer<typeof partnerSchema>

interface Benefit {
  id: string
  name: string
  type: 'DESCONTO' | 'CASHBACK' | 'PONTOS' | 'ACESSO_EXCLUSIVO'
  value: Record<string, unknown>
  isActive: boolean
}

interface City {
  id: string
  name: string
  state: string
}

export default function NovoParceiroPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [logo, setLogo] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [gallery, setGallery] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      category: '',
      cityId: ''
    }
  })

  const fetchBenefits = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/benefits')
      const data = await response.json()
      if (data.data) {
        setBenefits(data.data.filter((b: Benefit) => b.isActive))
      }
    } catch (error) {
      console.error('Erro ao buscar benefícios:', error)
    }
  }, [])

  const fetchCities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/cities')
      const data = await response.json()
      if (data.data) {
        setCities(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar cidades:', error)
    }
  }, [])

  useEffect(() => {
    fetchBenefits()
    fetchCities()
  }, [fetchBenefits, fetchCities])

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14)
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const getBenefitLabel = (benefit: Benefit): string => {
    const value = benefit.value as Record<string, number>
    switch (benefit.type) {
      case 'DESCONTO':
        return `${value.percentage}% de desconto`
      case 'CASHBACK':
        return `${value.percentage}% de cashback`
      case 'PONTOS':
        return `${value.monthlyPoints} pontos/mês`
      case 'ACESSO_EXCLUSIVO':
        return 'Acesso exclusivo'
      default:
        return 'Benefício'
    }
  }

  const onSubmit = async (data: PartnerFormData) => {
    setIsLoading(true)

    try {
      const payload = {
        ...data,
        logo,
        banner,
        gallery,
        benefitIds: selectedBenefits,
        cnpj: data.cnpj.replace(/\D/g, ''),
        phone: data.phone?.replace(/\D/g, '') || '',
        whatsapp: data.whatsapp.replace(/\D/g, ''),
      }

      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Parceiro criado com sucesso!')
        router.push('/admin/parceiros')
      } else {
        toast.error(result.error || 'Erro ao criar parceiro')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao criar parceiro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/parceiros">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Parceiro</h1>
          <p className="text-muted-foreground">Cadastre uma nova empresa parceira</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Card de Imagens */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
            <CardDescription>Logo, banner e galeria do parceiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label>Banner (1200x300 recomendado)</Label>
              <ImageUpload
                value={banner}
                onChange={setBanner}
                folder="parceiros/banners"
                aspectRatio="banner"
                placeholder="Clique para adicionar banner"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo (formato quadrado)</Label>
              <div className="w-32">
                <ImageUpload
                  value={logo}
                  onChange={setLogo}
                  folder="parceiros/logos"
                  aspectRatio="square"
                  placeholder="Logo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Galeria de Fotos (opcional)</Label>
              <GalleryUpload
                value={gallery}
                onChange={setGallery}
                folder="parceiros/gallery"
                maxImages={10}
              />
            </div>

          </CardContent>
        </Card>

        {/* Card Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>Informações principais do parceiro</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Razão Social *</Label>
              <Input id="companyName" {...register('companyName')} placeholder="Nome da empresa" />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input id="tradeName" {...register('tradeName')} placeholder="Nome fantasia" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input 
                id="cnpj" 
                {...register('cnpj')} 
                placeholder="00.000.000/0000-00"
                onChange={(e) => setValue('cnpj', formatCNPJ(e.target.value))}
              />
              {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={watch('category') || 'none'} 
                onValueChange={(value) => setValue('category', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {PARTNER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                {...register('description')} 
                placeholder="Descreva o parceiro..."
                rows={3}
              />
            </div>

          </CardContent>
        </Card>

        {/* Card Acesso */}
        <Card>
          <CardHeader>
            <CardTitle>Dados de Acesso</CardTitle>
            <CardDescription>Email e senha para o parceiro acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email de acesso *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="email@empresa.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

          </CardContent>
        </Card>

        {/* Card Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
            <CardDescription>Informações de contato do parceiro</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input 
                id="whatsapp" 
                {...register('whatsapp')} 
                placeholder="(00) 00000-0000"
                onChange={(e) => setValue('whatsapp', formatPhone(e.target.value))}
              />
              {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                {...register('phone')} 
                placeholder="(00) 0000-0000"
                onChange={(e) => setValue('phone', formatPhone(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register('website')} placeholder="https://www.empresa.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" {...register('instagram')} placeholder="@empresa" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" {...register('facebook')} placeholder="facebook.com/empresa" />
            </div>

          </CardContent>
        </Card>

        {/* Card Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>Localização do parceiro</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input id="zipCode" {...register('zipCode')} placeholder="00000-000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId">Cidade *</Label>
              <Select 
                value={watch('cityId') || 'none'} 
                onValueChange={(value) => setValue('cityId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>{city.name} - {city.state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cityId && <p className="text-xs text-destructive">{errors.cityId.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" {...register('address')} placeholder="Rua, Avenida..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input id="addressNumber" {...register('addressNumber')} placeholder="123" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" {...register('neighborhood')} placeholder="Bairro" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" {...register('complement')} placeholder="Sala, Bloco..." />
            </div>

          </CardContent>
        </Card>

        {/* Card Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle>Benefícios Oferecidos</CardTitle>
            <CardDescription>Selecione os benefícios que este parceiro vai oferecer aos assinantes</CardDescription>
          </CardHeader>
          <CardContent>
            {benefits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum benefício cadastrado. <Link href="/admin/beneficios" className="text-primary underline">Cadastre benefícios primeiro.</Link>
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {benefits.map((benefit) => (
                  <label
                    key={benefit.id}
                    htmlFor={`benefit-${benefit.id}`}
                    className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`benefit-${benefit.id}`}
                      checked={selectedBenefits.includes(benefit.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBenefits(prev => [...prev, benefit.id])
                        } else {
                          setSelectedBenefits(prev => prev.filter(id => id !== benefit.id))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{benefit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getBenefitLabel(benefit)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/parceiros">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Parceiro
              </>
            )}
          </Button>
        </div>

      </form>
    </div>
  )
}

