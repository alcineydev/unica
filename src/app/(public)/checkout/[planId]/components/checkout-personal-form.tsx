'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, CreditCard, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PersonalFormProps {
  data: {
    name: string
    email: string
    cpfCnpj: string
    phone: string
  }
  onChange: (data: PersonalFormProps['data']) => void
  onNext: () => void
  onAddressFound?: (address: {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }) => void
  disabled?: boolean
}

export default function CheckoutPersonalForm({ data, onChange, onNext, onAddressFound, disabled }: PersonalFormProps) {
  const [lookingUp, setLookingUp] = useState(false)
  const [lookedUp, setLookedUp] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14)
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
  }

  // Lookup de email existente com debounce
  const lookupEmail = useCallback(async (email: string) => {
    if (!email || !email.includes('@') || !email.includes('.') || lookedUp) return

    setLookingUp(true)
    try {
      const res = await fetch('/api/checkout/asaas/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const result = await res.json()

      if (result.found && result.data) {
        const d = result.data
        // Preencher dados pessoais (apenas campos vazios)
        const updated = { ...data, email }
        if (!data.name && d.name) updated.name = d.name
        if (!data.cpfCnpj && d.cpfCnpj) updated.cpfCnpj = d.cpfCnpj
        if (!data.phone && d.phone) updated.phone = d.phone
        onChange(updated)

        // Preencher endereço se callback disponível
        if (onAddressFound && (d.cep || d.street || d.city)) {
          onAddressFound({
            cep: d.cep || '',
            street: d.street || '',
            number: d.number || '',
            complement: d.complement || '',
            neighborhood: d.neighborhood || '',
            city: d.city || '',
            state: d.state || '',
          })
        }

        toast.success('Dados encontrados! Verifique as informações.')
        setLookedUp(true)
      }
    } catch {
      // silencioso - não impede o checkout
    } finally {
      setLookingUp(false)
    }
  }, [data, onChange, onAddressFound, lookedUp])

  const handleEmailBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      lookupEmail(data.email)
    }, 300)
  }

  const validate = () => {
    if (!data.name?.trim()) return 'Nome é obrigatório'
    if (!data.email?.trim() || !data.email.includes('@')) return 'Email válido é obrigatório'
    const cpf = data.cpfCnpj.replace(/\D/g, '')
    if (cpf.length !== 11 && cpf.length !== 14) return 'CPF ou CNPJ válido é obrigatório'
    const phone = data.phone.replace(/\D/g, '')
    if (phone.length < 10) return 'Telefone válido é obrigatório'
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
            <User className="h-4 w-4 text-primary" />
          </div>
          Dados Pessoais
        </CardTitle>
        <CardDescription>Informe seus dados para criar a conta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email primeiro - para lookup */}
        <div className="space-y-2">
          <Label htmlFor="checkout-email" className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> Email *
          </Label>
          <div className="relative">
            <Input
              id="checkout-email"
              type="email"
              value={data.email}
              onChange={(e) => {
                onChange({ ...data, email: e.target.value })
                setLookedUp(false)
              }}
              onBlur={handleEmailBlur}
              placeholder="seu@email.com"
              disabled={disabled}
            />
            {lookingUp && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Já tem conta? Digite seu email para preencher automaticamente.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-name">Nome Completo *</Label>
          <Input
            id="checkout-name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Seu nome completo"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="checkout-cpf" className="flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" /> CPF/CNPJ *
            </Label>
            <Input
              id="checkout-cpf"
              value={formatCPF(data.cpfCnpj)}
              onChange={(e) => onChange({ ...data, cpfCnpj: e.target.value.replace(/\D/g, '') })}
              placeholder="000.000.000-00"
              maxLength={18}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout-phone" className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Telefone *
            </Label>
            <Input
              id="checkout-phone"
              value={formatPhone(data.phone)}
              onChange={(e) => onChange({ ...data, phone: e.target.value.replace(/\D/g, '') })}
              placeholder="(00) 00000-0000"
              maxLength={15}
              disabled={disabled}
            />
          </div>
        </div>

        <Button onClick={handleNext} className="w-full mt-2" disabled={disabled || lookingUp}>
          Continuar
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
