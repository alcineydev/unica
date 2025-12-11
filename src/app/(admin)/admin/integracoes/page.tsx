'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  MessageCircle,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface Integration {
  id: string
  type: string
  name: string
  config: Record<string, string>
  isActive: boolean
  lastSync: string | null
}

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Form states
  const [mercadoPago, setMercadoPago] = useState({
    accessToken: '',
    publicKey: '',
    webhookUrl: '',
  })

  const [evolutionApi, setEvolutionApi] = useState({
    baseUrl: '',
    apiKey: '',
    instanceName: '',
  })

  const [resend, setResend] = useState({
    apiKey: '',
    fromEmail: '',
    fromName: '',
  })

  useEffect(() => {
    loadIntegrations()
  }, [])

  async function loadIntegrations() {
    try {
      const response = await fetch('/api/admin/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data)

        // Preencher formulários com dados existentes
        for (const integration of data) {
          if (integration.type === 'PAYMENT') {
            setMercadoPago({
              accessToken: integration.config.accessToken || '',
              publicKey: integration.config.publicKey || '',
              webhookUrl: integration.config.webhookUrl || '',
            })
          } else if (integration.type === 'EVOLUTION_API') {
            setEvolutionApi({
              baseUrl: integration.config.baseUrl || '',
              apiKey: integration.config.apiKey || '',
              instanceName: integration.config.instanceName || '',
            })
          } else if (integration.type === 'EMAIL') {
            setResend({
              apiKey: integration.config.apiKey || '',
              fromEmail: integration.config.fromEmail || '',
              fromName: integration.config.fromName || '',
            })
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error)
      toast.error('Erro ao carregar integrações')
    } finally {
      setLoading(false)
    }
  }

  async function saveIntegration(type: string, name: string, config: Record<string, string>) {
    setSaving(type)
    
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, config, isActive: true }),
      })

      if (response.ok) {
        toast.success('Integração salva com sucesso!')
        loadIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar integração')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar integração')
    } finally {
      setSaving(null)
    }
  }

  async function testIntegration(type: string, config: Record<string, string>) {
    setTesting(type)
    
    try {
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Erro ao testar:', error)
      toast.error('Erro ao testar conexão')
    } finally {
      setTesting(null)
    }
  }

  function getIntegrationStatus(type: string): Integration | undefined {
    return integrations.find((i) => i.type === type)
  }

  function toggleSecretVisibility(field: string) {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Configure as integrações com serviços externos
        </p>
      </div>

      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Mercado Pago */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Mercado Pago
                  </CardTitle>
                  <CardDescription>
                    Integração para pagamentos de assinaturas
                  </CardDescription>
                </div>
                {getIntegrationStatus('PAYMENT') && (
                  <Badge
                    variant={getIntegrationStatus('PAYMENT')?.isActive ? 'default' : 'secondary'}
                    className={getIntegrationStatus('PAYMENT')?.isActive ? 'bg-green-600' : ''}
                  >
                    {getIntegrationStatus('PAYMENT')?.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mp-access-token">Access Token *</Label>
                <div className="flex gap-2">
                  <Input
                    id="mp-access-token"
                    type={showSecrets['mp-access-token'] ? 'text' : 'password'}
                    value={mercadoPago.accessToken}
                    onChange={(e) => setMercadoPago({ ...mercadoPago, accessToken: e.target.value })}
                    placeholder="APP_USR-..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => toggleSecretVisibility('mp-access-token')}
                  >
                    {showSecrets['mp-access-token'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mp-public-key">Public Key</Label>
                <Input
                  id="mp-public-key"
                  value={mercadoPago.publicKey}
                  onChange={(e) => setMercadoPago({ ...mercadoPago, publicKey: e.target.value })}
                  placeholder="APP_USR-..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mp-webhook">Webhook URL</Label>
                <Input
                  id="mp-webhook"
                  value={mercadoPago.webhookUrl}
                  onChange={(e) => setMercadoPago({ ...mercadoPago, webhookUrl: e.target.value })}
                  placeholder="https://seu-dominio.com/api/webhooks/mercadopago"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => testIntegration('PAYMENT', mercadoPago)}
                  disabled={!mercadoPago.accessToken || testing === 'PAYMENT'}
                >
                  {testing === 'PAYMENT' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  onClick={() => saveIntegration('PAYMENT', 'Mercado Pago', mercadoPago)}
                  disabled={!mercadoPago.accessToken || saving === 'PAYMENT'}
                >
                  {saving === 'PAYMENT' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolution API */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Evolution API (WhatsApp)
                  </CardTitle>
                  <CardDescription>
                    Integração para envio de mensagens via WhatsApp
                  </CardDescription>
                </div>
                {getIntegrationStatus('EVOLUTION_API') && (
                  <Badge
                    variant={getIntegrationStatus('EVOLUTION_API')?.isActive ? 'default' : 'secondary'}
                    className={getIntegrationStatus('EVOLUTION_API')?.isActive ? 'bg-green-600' : ''}
                  >
                    {getIntegrationStatus('EVOLUTION_API')?.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evo-url">URL da API *</Label>
                <Input
                  id="evo-url"
                  value={evolutionApi.baseUrl}
                  onChange={(e) => setEvolutionApi({ ...evolutionApi, baseUrl: e.target.value })}
                  placeholder="https://sua-evolution-api.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evo-api-key">API Key *</Label>
                <div className="flex gap-2">
                  <Input
                    id="evo-api-key"
                    type={showSecrets['evo-api-key'] ? 'text' : 'password'}
                    value={evolutionApi.apiKey}
                    onChange={(e) => setEvolutionApi({ ...evolutionApi, apiKey: e.target.value })}
                    placeholder="Sua API Key"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => toggleSecretVisibility('evo-api-key')}
                  >
                    {showSecrets['evo-api-key'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evo-instance">Nome da Instância</Label>
                <Input
                  id="evo-instance"
                  value={evolutionApi.instanceName}
                  onChange={(e) => setEvolutionApi({ ...evolutionApi, instanceName: e.target.value })}
                  placeholder="unica"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => testIntegration('EVOLUTION_API', evolutionApi)}
                  disabled={!evolutionApi.baseUrl || !evolutionApi.apiKey || testing === 'EVOLUTION_API'}
                >
                  {testing === 'EVOLUTION_API' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  onClick={() => saveIntegration('EVOLUTION_API', 'Evolution API', evolutionApi)}
                  disabled={!evolutionApi.baseUrl || !evolutionApi.apiKey || saving === 'EVOLUTION_API'}
                >
                  {saving === 'EVOLUTION_API' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resend */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Resend (Email)
                  </CardTitle>
                  <CardDescription>
                    Integração para envio de emails transacionais
                  </CardDescription>
                </div>
                {getIntegrationStatus('EMAIL') && (
                  <Badge
                    variant={getIntegrationStatus('EMAIL')?.isActive ? 'default' : 'secondary'}
                    className={getIntegrationStatus('EMAIL')?.isActive ? 'bg-green-600' : ''}
                  >
                    {getIntegrationStatus('EMAIL')?.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-api-key">API Key *</Label>
                <div className="flex gap-2">
                  <Input
                    id="resend-api-key"
                    type={showSecrets['resend-api-key'] ? 'text' : 'password'}
                    value={resend.apiKey}
                    onChange={(e) => setResend({ ...resend, apiKey: e.target.value })}
                    placeholder="re_..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => toggleSecretVisibility('resend-api-key')}
                  >
                    {showSecrets['resend-api-key'] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resend-from-email">Email de Envio</Label>
                <Input
                  id="resend-from-email"
                  type="email"
                  value={resend.fromEmail}
                  onChange={(e) => setResend({ ...resend, fromEmail: e.target.value })}
                  placeholder="noreply@seu-dominio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resend-from-name">Nome do Remetente</Label>
                <Input
                  id="resend-from-name"
                  value={resend.fromName}
                  onChange={(e) => setResend({ ...resend, fromName: e.target.value })}
                  placeholder="Unica Clube de Benefícios"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => testIntegration('EMAIL', resend)}
                  disabled={!resend.apiKey || testing === 'EMAIL'}
                >
                  {testing === 'EMAIL' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  onClick={() => saveIntegration('EMAIL', 'Resend', resend)}
                  disabled={!resend.apiKey || saving === 'EMAIL'}
                >
                  {saving === 'EMAIL' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
