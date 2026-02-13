'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User, Mail, Phone, CreditCard, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, LogIn,
  Eye, EyeOff, KeyRound
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface PersonalFormData {
  name: string
  email: string
  cpfCnpj: string
  phone: string
  password: string
  confirmPassword: string
}

interface PersonalFormProps {
  data: PersonalFormData
  onChange: (data: PersonalFormData) => void
  onNext: () => void
  disabled?: boolean
}

export default function CheckoutPersonalForm({ data, onChange, onNext, disabled }: PersonalFormProps) {
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{
    exists: boolean
    hasActivePlan?: boolean
    planName?: string
  } | null>(null)

  const checkEmail = useCallback(async (email: string) => {
    if (!email || !email.includes('@') || email.length < 5) {
      setEmailStatus(null)
      return
    }
    setCheckingEmail(true)
    try {
      const res = await fetch('/api/checkout/asaas/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await res.json()
      setEmailStatus(result)

      if (result.found && result.data) {
        const d = result.data
        const updates: PersonalFormData = { ...data, email }
        if (d.name && !data.name) updates.name = d.name
        if (d.cpfCnpj && !data.cpfCnpj) updates.cpfCnpj = d.cpfCnpj
        if (d.phone && !data.phone) updates.phone = d.phone
        onChange(updates)
        toast.info('Dados encontrados! Preenchemos automaticamente para você.')
        // Marcar como existente para esconder campos de senha
        setEmailStatus({ exists: true, hasActivePlan: result.hasActivePlan, planName: result.planName })
      }
    } catch {
      setEmailStatus(null)
    } finally {
      setCheckingEmail(false)
    }
  }, [data, onChange])

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
    // Senha só obrigatória se NÃO tem conta existente
    if (!emailStatus?.exists) {
      if (!data.password || data.password.length < 6) return 'Senha deve ter no mínimo 6 caracteres'
      if (data.password !== data.confirmPassword) return 'As senhas não coincidem'
    }
    return null
  }

  const handleNext = () => {
    if (emailStatus?.hasActivePlan) {
      toast.error('Este email já possui uma assinatura ativa!')
      return
    }
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }
    onNext()
  }

  const passwordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '' }
    if (pwd.length < 6) return { label: 'Muito curta', color: 'text-red-500' }
    if (pwd.length < 8) return { label: 'Fraca', color: 'text-amber-500' }
    const hasUpper = /[A-Z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length
    if (score >= 2 && pwd.length >= 8) return { label: 'Forte', color: 'text-green-500' }
    return { label: 'Média', color: 'text-amber-500' }
  }

  const strength = passwordStrength(data.password)
  const passwordsMatch = data.password && data.confirmPassword && data.password === data.confirmPassword

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          Seus Dados
        </CardTitle>
        <CardDescription>Informe seus dados para criar sua conta e assinar o plano</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Email PRIMEIRO */}
        <div className="space-y-2">
          <Label htmlFor="checkout-email" className="flex items-center gap-1 text-sm font-medium">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email *
          </Label>
          <div className="relative">
            <Input
              id="checkout-email"
              type="email"
              value={data.email}
              onChange={(e) => {
                onChange({ ...data, email: e.target.value })
                setEmailStatus(null)
              }}
              onBlur={(e) => checkEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={disabled}
              className={emailStatus?.hasActivePlan ? 'border-amber-400' : ''}
            />
            {checkingEmail && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {emailStatus?.exists && !emailStatus.hasActivePlan && !checkingEmail && (
              <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Já tem conta? Os dados serão preenchidos automaticamente.
          </p>
        </div>

        {/* Alerta: plano ativo */}
        {emailStatus?.hasActivePlan && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              <p className="font-medium text-amber-700">Este email já possui uma assinatura ativa!</p>
              <p className="text-amber-600 text-xs mt-1">Plano: {emailStatus.planName}</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/login"><LogIn className="h-3.5 w-3.5 mr-1" /> Fazer Login</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Conta encontrada */}
        {emailStatus?.exists && !emailStatus.hasActivePlan && (
          <Alert className="border-green-300 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-700">
              Conta encontrada! Seus dados foram preenchidos. Você usará sua senha atual para acessar.
            </AlertDescription>
          </Alert>
        )}

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="checkout-name" className="text-sm font-medium">Nome Completo *</Label>
          <Input
            id="checkout-name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Seu nome completo"
            disabled={disabled}
          />
        </div>

        {/* CPF + Telefone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="checkout-cpf" className="flex items-center gap-1 text-sm font-medium">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> CPF/CNPJ *
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
            <Label htmlFor="checkout-phone" className="flex items-center gap-1 text-sm font-medium">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Telefone *
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

        {/* Senha - SÓ MOSTRA SE NÃO TEM CONTA */}
        {!emailStatus?.exists && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Crie sua senha de acesso</span>
            </div>

            <div className="space-y-3">
              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="checkout-password" className="text-sm font-medium">Senha *</Label>
                <div className="relative">
                  <Input
                    id="checkout-password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => onChange({ ...data, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    disabled={disabled}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {data.password && (
                  <p className={`text-[11px] font-medium ${strength.color}`}>
                    Força: {strength.label}
                  </p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="checkout-confirm-password" className="text-sm font-medium">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="checkout-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={data.confirmPassword}
                    onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })}
                    placeholder="Repita a senha"
                    disabled={disabled}
                    className={`pr-10 ${
                      data.confirmPassword
                        ? passwordsMatch ? 'border-green-400' : 'border-red-400'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {data.confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-red-500">As senhas não coincidem</p>
                )}
                {!!passwordsMatch && (
                  <p className="text-[11px] text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Senhas coincidem
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleNext}
          className="w-full mt-2 h-11"
          disabled={disabled || !!emailStatus?.hasActivePlan}
        >
          Continuar
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
