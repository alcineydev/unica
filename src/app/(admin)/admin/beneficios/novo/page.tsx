'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Gift,
  Percent,
  Coins,
  Star,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const benefitTypes = [
  { value: 'DESCONTO', label: 'Desconto', icon: Percent, description: 'Porcentagem ou valor fixo de desconto' },
  { value: 'CASHBACK', label: 'Cashback', icon: Coins, description: 'Retorno em dinheiro ou crédito' },
  { value: 'PONTOS', label: 'Pontos', icon: Star, description: 'Acumule pontos para trocar por prêmios' },
  { value: 'ACESSO_EXCLUSIVO', label: 'Acesso Exclusivo', icon: Lock, description: 'Acesso a áreas ou serviços exclusivos' },
]

export default function NovoBeneficioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'DESCONTO',
    isActive: true,
    // Value fields (dinâmico baseado no tipo)
    discountType: 'percentage', // percentage | fixed
    discountValue: '',
    cashbackPercentage: '',
    pointsMultiplier: '',
    accessDescription: '',
  })

  // Montar objeto value baseado no tipo
  const buildValueObject = () => {
    switch (formData.type) {
      case 'DESCONTO':
        return {
          type: formData.discountType,
          value: parseFloat(formData.discountValue) || 0,
        }
      case 'CASHBACK':
        return {
          percentage: parseFloat(formData.cashbackPercentage) || 0,
        }
      case 'PONTOS':
        return {
          multiplier: parseFloat(formData.pointsMultiplier) || 1,
        }
      case 'ACESSO_EXCLUSIVO':
        return {
          description: formData.accessDescription,
        }
      default:
        return {}
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          value: buildValueObject(),
          isActive: formData.isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar benefício')
      }

      toast.success('Benefício criado com sucesso!')
      router.push('/admin/beneficios')
    } catch (error) {
      console.error('Erro ao criar benefício:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar benefício')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = benefitTypes.find(t => t.value === formData.type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/beneficios">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Novo Benefício</h1>
            <p className="text-muted-foreground">
              Crie um novo benefício para os parceiros oferecerem
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Dados principais do benefício
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: 10% de desconto"
                  disabled={loading}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o benefício..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Benefício ativo e disponível para uso
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tipo e Valor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedType && <selectedType.icon className="h-5 w-5" />}
                Tipo do Benefício
              </CardTitle>
              <CardDescription>
                Configure o tipo e valor do benefício
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {benefitTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                        formData.type === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                      disabled={loading}
                    >
                      <type.icon className={`h-6 w-6 ${formData.type === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${formData.type === type.value ? 'text-primary' : ''}`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedType && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedType.description}
                  </p>
                )}
              </div>

              {/* Campos dinâmicos baseado no tipo */}
              {formData.type === 'DESCONTO' && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Valor {formData.discountType === 'percentage' ? '(%)' : '(R$)'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.discountType === 'percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                      min="0"
                      step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {formData.type === 'CASHBACK' && (
                <div className="space-y-2">
                  <Label>Porcentagem de Cashback (%)</Label>
                  <Input
                    type="number"
                    value={formData.cashbackPercentage}
                    onChange={(e) => setFormData({ ...formData, cashbackPercentage: e.target.value })}
                    placeholder="Ex: 5"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={loading}
                  />
                </div>
              )}

              {formData.type === 'PONTOS' && (
                <div className="space-y-2">
                  <Label>Multiplicador de Pontos</Label>
                  <Input
                    type="number"
                    value={formData.pointsMultiplier}
                    onChange={(e) => setFormData({ ...formData, pointsMultiplier: e.target.value })}
                    placeholder="Ex: 2 (dobro de pontos)"
                    min="1"
                    step="0.5"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    1 = normal, 2 = dobro, 3 = triplo...
                  </p>
                </div>
              )}

              {formData.type === 'ACESSO_EXCLUSIVO' && (
                <div className="space-y-2">
                  <Label>Descrição do Acesso</Label>
                  <Textarea
                    value={formData.accessDescription}
                    onChange={(e) => setFormData({ ...formData, accessDescription: e.target.value })}
                    placeholder="Descreva o que está incluído no acesso exclusivo..."
                    rows={3}
                    disabled={loading}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/admin/beneficios">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Benefício
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
