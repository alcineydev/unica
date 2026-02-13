'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, CreditCard, ChevronRight } from 'lucide-react'
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
  disabled?: boolean
}

export default function CheckoutPersonalForm({ data, onChange, onNext, disabled }: PersonalFormProps) {

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

        <div className="space-y-2">
          <Label htmlFor="checkout-email" className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> Email *
          </Label>
          <Input
            id="checkout-email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            placeholder="seu@email.com"
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

        <Button onClick={handleNext} className="w-full mt-2" disabled={disabled}>
          Continuar
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
