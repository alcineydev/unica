'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface AddressFormProps {
  data: {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }
  onChange: (data: AddressFormProps['data']) => void
  onNext: () => void
  onBack: () => void
  disabled?: boolean
}

export default function CheckoutAddressForm({ data, onChange, onNext, onBack, disabled }: AddressFormProps) {
  const [searchingCep, setSearchingCep] = useState(false)

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
  }

  const searchCEP = async () => {
    const cep = data.cep.replace(/\D/g, '')
    if (cep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos')
      return
    }
    setSearchingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const result = await res.json()
      if (result.erro) {
        toast.error('CEP não encontrado')
        return
      }
      onChange({
        ...data,
        street: result.logradouro || data.street,
        neighborhood: result.bairro || data.neighborhood,
        city: result.localidade || data.city,
        state: result.uf || data.state,
      })
      toast.success('Endereço encontrado!')
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setSearchingCep(false)
    }
  }

  const validate = () => {
    if (!data.cep || data.cep.replace(/\D/g, '').length !== 8) return 'CEP é obrigatório'
    if (!data.street?.trim()) return 'Logradouro é obrigatório'
    if (!data.number?.trim()) return 'Número é obrigatório'
    if (!data.neighborhood?.trim()) return 'Bairro é obrigatório'
    if (!data.city?.trim()) return 'Cidade é obrigatória'
    if (!data.state?.trim()) return 'Estado é obrigatório'
    return null
  }

  const handleNext = () => {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }
    onNext()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          Endereço
        </CardTitle>
        <CardDescription>Endereço para cobrança</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CEP */}
        <div className="flex gap-2">
          <div className="space-y-2 flex-1">
            <Label htmlFor="checkout-cep">CEP *</Label>
            <Input
              id="checkout-cep"
              value={formatCEP(data.cep)}
              onChange={(e) => onChange({ ...data, cep: e.target.value.replace(/\D/g, '') })}
              placeholder="00000-000"
              maxLength={9}
              disabled={disabled}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={searchCEP}
              disabled={searchingCep || disabled}
              className="h-10 w-10"
            >
              {searchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-street">Logradouro *</Label>
          <Input
            id="checkout-street"
            value={data.street}
            onChange={(e) => onChange({ ...data, street: e.target.value })}
            placeholder="Rua, Avenida..."
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="checkout-number">Número *</Label>
            <Input
              id="checkout-number"
              value={data.number}
              onChange={(e) => onChange({ ...data, number: e.target.value })}
              placeholder="Nº"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="checkout-complement">Complemento</Label>
            <Input
              id="checkout-complement"
              value={data.complement}
              onChange={(e) => onChange({ ...data, complement: e.target.value })}
              placeholder="Apto, Bloco..."
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-neighborhood">Bairro *</Label>
          <Input
            id="checkout-neighborhood"
            value={data.neighborhood}
            onChange={(e) => onChange({ ...data, neighborhood: e.target.value })}
            placeholder="Bairro"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="checkout-city">Cidade *</Label>
            <Input
              id="checkout-city"
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              placeholder="Cidade"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout-state">UF *</Label>
            <Input
              id="checkout-state"
              value={data.state}
              onChange={(e) => onChange({ ...data, state: e.target.value.toUpperCase() })}
              placeholder="UF"
              maxLength={2}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={onBack} className="flex-1" disabled={disabled}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <Button onClick={handleNext} className="flex-1" disabled={disabled}>
            Continuar <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
