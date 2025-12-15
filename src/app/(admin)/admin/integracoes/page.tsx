'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  Plus,
  Smartphone,
  QrCode,
  Trash2,
  PowerOff,
  CheckCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

interface Integration {
  id: string
  type: string
  name: string
  config: Record<string, string>
  isActive: boolean
  lastSync: string | null
}

interface WhatsAppInstance {
  id: string
  name: string
  instanceId: string
  status: string
  phoneNumber: string | null
  profileName: string | null
  profilePic: string | null
  createdAt: string
}

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // WhatsApp instances state
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [loadingInstances, setLoadingInstances] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<{ instanceId: string; qrCode: string } | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [loadingQr, setLoadingQr] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState<string | null>(null)

  // Form states
  const [mercadoPago, setMercadoPago] = useState({
    mode: 'sandbox' as 'sandbox' | 'production',
    accessToken: '',
    publicKey: '',
    webhookUrl: '',
  })
  const [savingMercadoPago, setSavingMercadoPago] = useState(false)
  const [testingMercadoPago, setTestingMercadoPago] = useState(false)

  const [resend, setResend] = useState({
    apiKey: '',
    fromEmail: '',
    fromName: '',
  })

  useEffect(() => {
    loadIntegrations()
    fetchInstances()
    loadMercadoPagoConfig()
  }, [])

  async function loadMercadoPagoConfig() {
    try {
      const response = await fetch('/api/admin/integrations/mercadopago', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setMercadoPago({
          mode: data.mode || 'sandbox',
          accessToken: data.accessToken || '',
          publicKey: data.publicKey || '',
          webhookUrl: data.webhookUrl || 'https://unica-theta.vercel.app/api/webhooks/mercadopago',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar config Mercado Pago:', error)
    }
  }

  async function saveMercadoPago() {
    setSavingMercadoPago(true)
    try {
      const response = await fetch('/api/admin/integrations/mercadopago', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(mercadoPago),
      })
      if (response.ok) {
        toast.success('Configurações do Mercado Pago salvas!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSavingMercadoPago(false)
    }
  }

  async function testMercadoPago() {
    if (!mercadoPago.accessToken) {
      toast.error('Informe o Access Token')
      return
    }
    setTestingMercadoPago(true)
    try {
      const response = await fetch('/api/admin/integrations/mercadopago/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken: mercadoPago.accessToken }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Conexão com Mercado Pago OK!')
      } else {
        toast.error(data.error || 'Falha na conexão')
      }
    } catch (error) {
      toast.error('Erro ao testar conexão')
    } finally {
      setTestingMercadoPago(false)
    }
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(mercadoPago.webhookUrl)
    toast.success('URL copiada!')
  }

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
              mode: integration.config.mode || 'sandbox',
              accessToken: integration.config.accessToken || '',
              publicKey: integration.config.publicKey || '',
              webhookUrl: integration.config.webhookUrl || '',
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

  async function fetchInstances() {
    try {
      const response = await fetch('/api/admin/whatsapp/instances')
      const data = await response.json()
      setInstances(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    } finally {
      setLoadingInstances(false)
    }
  }

  async function createInstance() {
    if (!newInstanceName.trim()) {
      toast.error('Digite um nome para a instância')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newInstanceName }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Instância criada com sucesso!')
        setNewInstanceName('')
        setDialogOpen(false)
        fetchInstances()
      } else {
        toast.error(data.error || 'Erro ao criar instância')
      }
    } catch (error) {
      toast.error('Erro ao criar instância')
    } finally {
      setCreating(false)
    }
  }

  async function deleteInstance(id: string) {
    try {
      const response = await fetch(`/api/admin/whatsapp/instances/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Instância removida com sucesso!')
        fetchInstances()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao remover instância')
      }
    } catch (error) {
      toast.error('Erro ao remover instância')
    }
  }

  async function connectInstance(instanceId: string) {
    setLoadingQr(true)
    setQrDialogOpen(true)
    
    try {
      const response = await fetch(`/api/admin/whatsapp/qrcode/${instanceId}`)
      const data = await response.json()

      if (response.ok && data.qrCode) {
        setQrCodeData({ instanceId, qrCode: data.qrCode })
      } else if (data.status === 'connected') {
        toast.success('WhatsApp já está conectado!')
        setQrDialogOpen(false)
        fetchInstances()
      } else {
        toast.error(data.error || 'Erro ao obter QR Code')
        setQrDialogOpen(false)
      }
    } catch (error) {
      toast.error('Erro ao obter QR Code')
      setQrDialogOpen(false)
    } finally {
      setLoadingQr(false)
    }
  }

  async function disconnectInstance(instanceId: string) {
    try {
      const response = await fetch(`/api/admin/whatsapp/disconnect/${instanceId}`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('WhatsApp desconectado!')
        fetchInstances()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao desconectar')
      }
    } catch (error) {
      toast.error('Erro ao desconectar')
    }
  }

  async function refreshStatus(id: string, instanceId: string) {
    setRefreshingStatus(id)
    try {
      const response = await fetch(`/api/admin/whatsapp/status/${instanceId}`)
      const data = await response.json()

      if (response.ok) {
        await fetch(`/api/admin/whatsapp/instances/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: data.status,
            phoneNumber: data.phoneNumber,
            profileName: data.profileName,
            profilePic: data.profilePic,
          }),
        })
        fetchInstances()
        toast.success('Status atualizado!')
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    } finally {
      setRefreshingStatus(null)
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

  function getStatusBadge(status: string) {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Conectando</Badge>
      default:
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Desconectado</Badge>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Configure as integrações com serviços externos
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Instances */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Instâncias WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Gerencie as conexões do WhatsApp para envio de notificações
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Instância
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Instância</DialogTitle>
                      <DialogDescription>
                        Crie uma nova instância do WhatsApp para enviar notificações
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Instância</Label>
                        <Input
                          id="name"
                          placeholder="Ex: Principal, Suporte, Marketing..."
                          value={newInstanceName}
                          onChange={(e) => setNewInstanceName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={createInstance} disabled={creating}>
                        {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        {creating ? 'Criando...' : 'Criar Instância'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* QR Code Dialog */}
              <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Conectar WhatsApp</DialogTitle>
                    <DialogDescription>
                      Escaneie o QR Code com seu WhatsApp para conectar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-6">
                    {loadingQr ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                      </div>
                    ) : qrCodeData?.qrCode ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <img 
                            src={qrCodeData.qrCode} 
                            alt="QR Code WhatsApp" 
                            className="w-64 h-64"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          Abra o WhatsApp no seu celular, vá em Configurações → Aparelhos conectados → Conectar um aparelho
                        </p>
                        <Button variant="outline" onClick={() => connectInstance(qrCodeData.instanceId)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Atualizar QR Code
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Erro ao carregar QR Code</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {loadingInstances ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : instances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma instância</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Crie sua primeira instância do WhatsApp para começar a enviar notificações
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {instances.map((instance) => (
                    <div key={instance.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{instance.name}</h4>
                        {getStatusBadge(instance.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {instance.instanceId}</p>
                      
                      {instance.status === 'connected' && (
                        <div className="flex items-center gap-3 p-2 bg-muted rounded">
                          {instance.profilePic && (
                            <img 
                              src={instance.profilePic} 
                              alt="Profile" 
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm">{instance.profileName || 'WhatsApp'}</p>
                            <p className="text-xs text-muted-foreground">{instance.phoneNumber}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {instance.status === 'connected' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => disconnectInstance(instance.instanceId)}
                          >
                            <PowerOff className="h-4 w-4 mr-1" />
                            Desconectar
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => connectInstance(instance.instanceId)}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            Conectar
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => refreshStatus(instance.id, instance.instanceId)}
                          disabled={refreshingStatus === instance.id}
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshingStatus === instance.id ? 'animate-spin' : ''}`} />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover instância?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação irá remover a instância &quot;{instance.name}&quot; e desconectar o WhatsApp.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteInstance(instance.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                <Badge
                  variant={mercadoPago.accessToken ? 'default' : 'secondary'}
                  className={mercadoPago.accessToken ? 'bg-green-600' : ''}
                >
                  {mercadoPago.accessToken ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configurado
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Não configurado
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modo de Operação */}
              <div className="space-y-3">
                <Label>Modo de Operação</Label>
                <RadioGroup
                  value={mercadoPago.mode}
                  onValueChange={(value: 'sandbox' | 'production') => 
                    setMercadoPago({ ...mercadoPago, mode: value })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sandbox" id="sandbox" />
                    <Label htmlFor="sandbox" className="cursor-pointer">Sandbox (Testes)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="production" id="production" />
                    <Label htmlFor="production" className="cursor-pointer">Produção</Label>
                  </div>
                </RadioGroup>
                
                {mercadoPago.mode === 'sandbox' && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Modo de Testes Ativo - Os pagamentos não serão cobrados</span>
                  </div>
                )}
              </div>

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
                <div className="flex gap-2">
                  <Input
                    id="mp-webhook"
                    value={mercadoPago.webhookUrl}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyWebhookUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure esta URL no painel do Mercado Pago para receber notificações de pagamento
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={testMercadoPago}
                  disabled={!mercadoPago.accessToken || testingMercadoPago}
                >
                  {testingMercadoPago ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  onClick={saveMercadoPago}
                  disabled={!mercadoPago.accessToken || savingMercadoPago}
                >
                  {savingMercadoPago && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
