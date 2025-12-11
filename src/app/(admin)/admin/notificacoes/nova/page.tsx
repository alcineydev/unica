'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Loader2, 
  Send, 
  Save, 
  MessageCircle,
  Mail,
  Bell,
  Users,
  Building2,
  Phone,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { WhatsAppPreview } from '@/components/admin/WhatsAppPreview'
import { PhoneInput, isValidPhone } from '@/components/ui/phone-input'

interface WhatsAppInstance {
  id: string
  name: string
  instanceId: string
  status: string
}

interface Plan {
  id: string
  name: string
}

interface City {
  id: string
  name: string
}

export default function NovaNotificacaoPage() {
  const router = useRouter()
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [phoneValid, setPhoneValid] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
    channel: 'whatsapp',
    instanceId: '',
    targetType: 'ALL_ASSINANTES',
    targetPlanId: '',
    targetCityId: '',
    individualNumber: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (form.targetType && form.targetType !== 'INDIVIDUAL') {
      loadRecipientCount()
    } else {
      setRecipientCount(null)
    }
  }, [form.targetType, form.targetPlanId, form.targetCityId])

  async function loadData() {
    try {
      const [instancesRes, plansRes, citiesRes] = await Promise.all([
        fetch('/api/admin/whatsapp/instances'),
        fetch('/api/admin/plans'),
        fetch('/api/admin/cities'),
      ])

      if (instancesRes.ok) {
        const data = await instancesRes.json()
        const connected = (data || []).filter((i: WhatsAppInstance) => i.status === 'connected')
        setInstances(connected)
        if (connected.length > 0) {
          setForm(f => ({ ...f, instanceId: connected[0].id }))
        }
      }

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data || [])
      }

      if (citiesRes.ok) {
        const data = await citiesRes.json()
        setCities(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function loadRecipientCount() {
    setLoadingCount(true)
    try {
      const params = new URLSearchParams({
        targetType: form.targetType,
        ...(form.targetPlanId && { targetPlanId: form.targetPlanId }),
        ...(form.targetCityId && { targetCityId: form.targetCityId }),
      })
      
      const response = await fetch(`/api/admin/notificacoes/count?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecipientCount(data.count)
      }
    } catch (error) {
      console.error('Erro ao carregar contagem:', error)
    } finally {
      setLoadingCount(false)
    }
  }

  async function handleSave() {
    if (!form.title || !form.message) {
      toast.error('Título e mensagem são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'DRAFT',
        }),
      })

      if (response.ok) {
        toast.success('Notificação salva como rascunho')
        router.push('/admin/notificacoes')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar notificação')
      }
    } catch (error) {
      toast.error('Erro ao salvar notificação')
    } finally {
      setSaving(false)
    }
  }

  async function handleSend() {
    if (!form.title || !form.message) {
      toast.error('Título e mensagem são obrigatórios')
      return
    }

    if (!form.instanceId && form.channel === 'whatsapp') {
      toast.error('Selecione uma instância WhatsApp')
      return
    }

    if (form.targetType === 'INDIVIDUAL' && !isValidPhone(form.individualNumber)) {
      toast.error('Digite um número de telefone válido')
      return
    }

    setSending(true)
    try {
      // Criar notificação
      const createResponse = await fetch('/api/admin/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'SENDING',
        }),
      })

      if (!createResponse.ok) {
        const data = await createResponse.json()
        toast.error(data.error || 'Erro ao criar notificação')
        return
      }

      const notification = await createResponse.json()

      // Enviar notificação
      const sendResponse = await fetch(`/api/admin/notificacoes/${notification.id}/enviar`, {
        method: 'POST',
      })

      const sendResult = await sendResponse.json()

      if (sendResponse.ok) {
        toast.success(`Notificação enviada! ${sendResult.sentCount} enviada(s), ${sendResult.failedCount} falharam`)
        router.push('/admin/notificacoes')
      } else {
        toast.error(sendResult.error || 'Erro ao enviar notificação')
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/notificacoes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Nova Notificação</h2>
            <p className="text-muted-foreground">
              Crie e envie uma notificação para seus clientes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário - 2 colunas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1 - Conteúdo da Mensagem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conteúdo da Mensagem
              </CardTitle>
              <CardDescription>
                Defina o conteúdo que será enviado na notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título (identificação interna) *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Promoção de Natal, Aviso de Manutenção..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  placeholder="Digite a mensagem que será enviada aos destinatários..."
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  URL da Imagem (opcional)
                </Label>
                <Input
                  id="imageUrl"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkUrl" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    URL do Link (opcional)
                  </Label>
                  <Input
                    id="linkUrl"
                    placeholder="https://..."
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkText">Texto do Botão</Label>
                  <Input
                    id="linkText"
                    placeholder="Saiba mais"
                    value={form.linkText}
                    onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Canal de Envio */}
          <Card>
            <CardHeader>
              <CardTitle>Canal de Envio</CardTitle>
              <CardDescription>
                Escolha por qual canal a notificação será enviada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, channel: 'whatsapp' })}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    form.channel === 'whatsapp' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <MessageCircle className={`h-8 w-8 mb-2 ${form.channel === 'whatsapp' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="font-medium">WhatsApp</span>
                </button>
                
                <button
                  type="button"
                  disabled
                  className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-muted opacity-50 cursor-not-allowed"
                >
                  <Mail className="h-8 w-8 mb-2 text-muted-foreground" />
                  <span className="font-medium">Email</span>
                  <Badge variant="secondary" className="mt-1 text-xs">Em breve</Badge>
                </button>
                
                <button
                  type="button"
                  disabled
                  className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-muted opacity-50 cursor-not-allowed"
                >
                  <Bell className="h-8 w-8 mb-2 text-muted-foreground" />
                  <span className="font-medium">Push</span>
                  <Badge variant="secondary" className="mt-1 text-xs">Em breve</Badge>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Instância WhatsApp */}
          {form.channel === 'whatsapp' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  Instância WhatsApp
                </CardTitle>
                <CardDescription>
                  Selecione a instância do WhatsApp que será usada para enviar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {instances.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Nenhuma instância WhatsApp conectada
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Vá em Integrações para conectar uma instância do WhatsApp.
                        </p>
                        <Button variant="outline" size="sm" className="mt-3" asChild>
                          <Link href="/admin/integracoes">
                            Ir para Integrações
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={form.instanceId}
                    onValueChange={(value) => setForm({ ...form, instanceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            {instance.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card 4 - Destinatários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Destinatários
              </CardTitle>
              <CardDescription>
                Selecione quem receberá esta notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={form.targetType}
                onValueChange={(value) => setForm({ 
                  ...form, 
                  targetType: value,
                  targetPlanId: '',
                  targetCityId: '',
                  individualNumber: '',
                })}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="INDIVIDUAL" id="individual" />
                  <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Phone className="h-4 w-4 text-blue-500" />
                    Número Individual
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="TODOS" id="todos" />
                  <Label htmlFor="todos" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Users className="h-4 w-4 text-purple-500" />
                    Todos (Assinantes + Parceiros)
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="ALL_ASSINANTES" id="assinantes" />
                  <Label htmlFor="assinantes" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Users className="h-4 w-4 text-green-500" />
                    Todos os Assinantes
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="PLANO_ESPECIFICO" id="plano" />
                  <Label htmlFor="plano" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Users className="h-4 w-4 text-orange-500" />
                    Assinantes por Plano
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="ALL_PARCEIROS" id="parceiros" />
                  <Label htmlFor="parceiros" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    Todos os Parceiros
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="PARCEIROS_CIDADE" id="cidade" />
                  <Label htmlFor="cidade" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-4 w-4 text-teal-500" />
                    Parceiros por Cidade
                  </Label>
                </div>
              </RadioGroup>

              {/* Input para número individual */}
              {form.targetType === 'INDIVIDUAL' && (
                <div className="space-y-2 pt-2">
                  <Label>Número de Telefone</Label>
                  <PhoneInput
                    value={form.individualNumber}
                    onChange={(value) => setForm({ ...form, individualNumber: value })}
                    onValidChange={setPhoneValid}
                  />
                  {form.individualNumber && !phoneValid && (
                    <p className="text-sm text-destructive">
                      Digite um número válido com DDD (10 ou 11 dígitos)
                    </p>
                  )}
                </div>
              )}

              {/* Select para plano */}
              {form.targetType === 'PLANO_ESPECIFICO' && (
                <div className="space-y-2 pt-2">
                  <Label>Selecione o Plano</Label>
                  <Select
                    value={form.targetPlanId}
                    onValueChange={(value) => setForm({ ...form, targetPlanId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Select para cidade */}
              {form.targetType === 'PARCEIROS_CIDADE' && (
                <div className="space-y-2 pt-2">
                  <Label>Selecione a Cidade</Label>
                  <Select
                    value={form.targetCityId}
                    onValueChange={(value) => setForm({ ...form, targetCityId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Contador de destinatários */}
              {form.targetType !== 'INDIVIDUAL' && (
                <div className="p-4 bg-muted rounded-lg mt-4">
                  <p className="text-sm flex items-center gap-2">
                    {loadingCount ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculando destinatários...
                      </>
                    ) : recipientCount !== null ? (
                      <>
                        <Users className="h-4 w-4" />
                        <strong>{recipientCount}</strong> destinatário(s) serão notificados
                      </>
                    ) : (
                      'Selecione os destinatários'
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer - Ações (dentro da área de conteúdo, não fixo) */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href="/admin/notificacoes">Cancelar</Link>
            </Button>
            <Button variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Rascunho
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={
                sending || 
                instances.length === 0 || 
                (form.targetType === 'INDIVIDUAL' && !phoneValid)
              }
            >
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar Agora
            </Button>
          </div>
        </div>

        {/* Preview - 1 coluna (sem sticky para evitar problemas de z-index) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                Visualize como a mensagem aparecerá
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WhatsAppPreview
                message={form.message}
                imageUrl={form.imageUrl || undefined}
                linkUrl={form.linkUrl || undefined}
                linkText={form.linkText || undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
