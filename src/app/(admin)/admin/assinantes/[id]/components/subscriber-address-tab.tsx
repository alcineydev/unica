'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddressTabProps {
  formData: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  saving: boolean
}

export default function SubscriberAddressTab({
  formData,
  onChange,
  saving,
}: AddressTabProps) {
  const [searchingCep, setSearchingCep] = useState(false)

  const address = (formData.address || {}) as Record<string, string>

  const updateAddress = (field: string, value: string) => {
    onChange({
      address: { ...address, [field]: value },
    })
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    return numbers.replace(/(\d{5})(\d)/, '$1-$2')
  }

  const searchCEP = async () => {
    const cep = (address.cep || '').replace(/\D/g, '')
    if (cep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos')
      return
    }

    setSearchingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()

      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }

      onChange({
        address: {
          ...address,
          cep,
          street: data.logradouro || address.street || '',
          neighborhood: data.bairro || address.neighborhood || '',
          city: data.localidade || address.city || '',
          state: data.uf || address.state || '',
          complement: data.complemento || address.complement || '',
        },
      })
      toast.success('Endereço encontrado!')
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setSearchingCep(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          Endereço
        </CardTitle>
        <CardDescription>
          Endereço residencial do assinante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CEP com busca */}
        <div className="flex gap-2">
          <div className="space-y-2 flex-1">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={formatCEP(address.cep || '')}
              onChange={(e) =>
                updateAddress('cep', e.target.value.replace(/\D/g, ''))
              }
              placeholder="00000-000"
              maxLength={9}
              disabled={saving}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={searchCEP}
              disabled={searchingCep || saving}
              className="h-10"
            >
              {searchingCep ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="street">Logradouro</Label>
            <Input
              id="street"
              value={address.street || ''}
              onChange={(e) => updateAddress('street', e.target.value)}
              placeholder="Rua, Avenida..."
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              value={address.number || ''}
              onChange={(e) => updateAddress('number', e.target.value)}
              placeholder="Nº"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={address.complement || ''}
              onChange={(e) => updateAddress('complement', e.target.value)}
              placeholder="Apto, Bloco..."
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={address.neighborhood || ''}
              onChange={(e) => updateAddress('neighborhood', e.target.value)}
              placeholder="Bairro"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressCity">Cidade</Label>
            <Input
              id="addressCity"
              value={address.city || ''}
              onChange={(e) => updateAddress('city', e.target.value)}
              placeholder="Cidade"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={address.state || ''}
              onChange={(e) => updateAddress('state', e.target.value)}
              placeholder="UF"
              maxLength={2}
              disabled={saving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
