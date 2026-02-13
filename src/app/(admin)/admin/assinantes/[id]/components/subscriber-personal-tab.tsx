'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, CreditCard, Calendar } from 'lucide-react'

interface PersonalTabProps {
  formData: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  saving: boolean
}

export default function SubscriberPersonalTab({
  formData,
  onChange,
  saving,
}: PersonalTabProps) {
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const displayCPF = formData.cpf ? formatCPF(formData.cpf as string) : ''
  const displayPhone = formData.phone
    ? formatPhone(formData.phone as string)
    : ''

  return (
    <div className="space-y-6">
      {/* Dados Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Dados de identificação do assinante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={(formData.name as string) || ''}
                onChange={(e) => onChange({ name: e.target.value })}
                disabled={saving}
                placeholder="Nome do assinante"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={(formData.email as string) || ''}
                onChange={(e) => onChange({ email: e.target.value })}
                disabled={saving}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf" className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" /> CPF
              </Label>
              <Input
                id="cpf"
                value={displayCPF}
                onChange={(e) =>
                  onChange({ cpf: e.target.value.replace(/\D/g, '') })
                }
                disabled={saving}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Telefone
              </Label>
              <Input
                id="phone"
                value={displayPhone}
                onChange={(e) =>
                  onChange({ phone: e.target.value.replace(/\D/g, '') })
                }
                disabled={saving}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Data de Nascimento
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={
                  formData.birthDate
                    ? new Date(formData.birthDate as string)
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  onChange({ birthDate: e.target.value || null })
                }
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segurança</CardTitle>
          <CardDescription>Alterar senha do assinante</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={(formData.password as string) || ''}
                onChange={(e) => onChange({ password: e.target.value })}
                disabled={saving}
                placeholder="Deixe vazio para manter atual"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
