'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Smartphone,
  Monitor,
  User,
  Key,
  Database,
  Trash2,
  Activity,
  Server,
  Webhook,
  UserPlus,
  CreditCard,
  AlertOctagon,
  UserMinus,
  Clock,
  Gift,
  Megaphone,
  ShoppingCart,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'

interface DiagnosticData {
  success: boolean
  currentUser: {
    id: string
    name: string
    email: string
    role: string
  }
  vapidConfig: {
    publicKeyConfigured: boolean
    privateKeyConfigured: boolean
    subjectConfigured: boolean
    publicKeyPreview: string | null
    webPushConfigured: boolean
  }
  statistics: {
    total: number
    active: number
    inactive: number
    byRole: Record<string, number>
    mySubscriptions: number
  }
  subscriptions: Array<{
    id: string
    visibleId: string
    endpoint: string
    fullEndpoint: string
    endpointProvider: string
    userId: string
    userName: string
    userEmail: string
    userRole: string
    platform: string
    userAgent: string
    deviceInfo: string
    isActive: boolean
    createdAt: string
    isCurrentUser: boolean
  }>
}

interface TestResult {
  success: boolean
  summary: {
    total: number
    success: number
    failed: number
    expired: number
  }
  results: Array<{
    subscriptionId: string
    status: string
    statusCode?: number
    message?: string
  }>
  error?: string
}

export default function PushDiagnosticsPage() {
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; eventType: string; sent: number; failed: number; errors: string[] } | null>(null)

  const fetchDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/push-diagnostics')
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        toast.error(result.error || 'Erro ao carregar diagnóstico')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  const testPush = async (testType: 'self' | 'all-admins' | 'specific', subscriptionId?: string) => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/push-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType, subscriptionId })
      })

      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast.success(`Push enviado! ${result.summary.success}/${result.summary.total} sucesso`)
      } else {
        toast.error(result.error || 'Falha no teste')
      }

      // Recarregar dados (subscriptions expiradas podem ter sido removidas)
      fetchDiagnostics()

    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao testar push')
    } finally {
      setTesting(false)
    }
  }

  const deleteSubscription = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta subscription?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/push-diagnostics?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Subscription removida com sucesso')
        fetchDiagnostics()
      } else {
        toast.error(result.error || 'Erro ao remover')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao remover subscription')
    } finally {
      setDeletingId(null)
    }
  }

  const clearAllSubscriptions = async () => {
    if (!confirm('Tem certeza que deseja remover TODAS as subscriptions?\n\nOs usuários precisarão permitir notificações novamente.')) {
      return
    }

    setClearingAll(true)
    try {
      const response = await fetch('/api/admin/push/clear-all', {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${result.deleted} subscription(s) removida(s)`)
        fetchDiagnostics()
      } else {
        toast.error(result.error || 'Erro ao limpar')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao limpar subscriptions')
    } finally {
      setClearingAll(false)
    }
  }

  const testWebhookEvent = async (eventType: string) => {
    setTestingWebhook(eventType)
    setWebhookResult(null)

    try {
      const response = await fetch('/api/admin/push/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType })
      })

      const result = await response.json()
      setWebhookResult(result)

      if (result.success) {
        toast.success(`Webhook ${eventType} testado! ${result.sent} push enviado(s)`)
      } else {
        toast.error(result.error || 'Falha no teste de webhook')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao testar webhook')
    } finally {
      setTestingWebhook(null)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Diagnóstico Push Notifications
          </h1>
          <p className="text-muted-foreground">
            Verificação completa do sistema de notificações push
          </p>
        </div>
        <Button onClick={fetchDiagnostics} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Usuário Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Usuário Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{data?.currentUser.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{data?.currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge>{data?.currentUser.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-sm">{data?.currentUser.id.substring(0, 8)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração VAPID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração VAPID
          </CardTitle>
          <CardDescription>
            Chaves necessárias para envio de push notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {data?.vapidConfig.publicKeyConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Public Key</span>
            </div>
            <div className="flex items-center gap-2">
              {data?.vapidConfig.privateKeyConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Private Key</span>
            </div>
            <div className="flex items-center gap-2">
              {data?.vapidConfig.subjectConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Subject (Email)</span>
            </div>
            <div className="flex items-center gap-2">
              {data?.vapidConfig.webPushConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>WebPush Configurado</span>
            </div>
          </div>
          {data?.vapidConfig.publicKeyPreview && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">Public Key (preview):</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                {data?.vapidConfig.publicKeyPreview}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{data?.statistics.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total Subscriptions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{data?.statistics.active || 0}</p>
              <p className="text-sm text-muted-foreground">Ativas</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{data?.statistics.inactive || 0}</p>
              <p className="text-sm text-muted-foreground">Inativas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{data?.statistics.mySubscriptions || 0}</p>
              <p className="text-sm text-muted-foreground">Minhas Subscriptions</p>
            </div>
            {Object.entries(data?.statistics.byRole || {}).map(([role, count]) => (
              <div key={role} className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Testar Push
          </CardTitle>
          <CardDescription>
            Envie uma notificação de teste para verificar o funcionamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => testPush('self')}
              disabled={testing || (data?.statistics.mySubscriptions || 0) === 0}
            >
              {testing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
              Testar Meus Dispositivos ({data?.statistics.mySubscriptions || 0})
            </Button>
            <Button
              onClick={() => testPush('all-admins')}
              disabled={testing}
              variant="secondary"
            >
              {testing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Monitor className="h-4 w-4 mr-2" />}
              Testar Todos os Admins
            </Button>
            <Button
              onClick={clearAllSubscriptions}
              disabled={clearingAll || (data?.statistics.total || 0) === 0}
              variant="destructive"
            >
              {clearingAll ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Limpar Todas ({data?.statistics.total || 0})
            </Button>
          </div>

          {/* Resultado do Teste */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Resultado do Teste:
              </h4>
              {testResult.error ? (
                <p className="text-red-600">{testResult.error}</p>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                    <div>Total: <strong>{testResult.summary?.total}</strong></div>
                    <div className="text-green-600">Sucesso: <strong>{testResult.summary?.success}</strong></div>
                    <div className="text-red-600">Falhou: <strong>{testResult.summary?.failed}</strong></div>
                    <div className="text-orange-600">Expirado: <strong>{testResult.summary?.expired}</strong></div>
                  </div>
                  <div className="space-y-1">
                    {testResult.results?.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {r.status === 'SUCCESS' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : r.status === 'EXPIRED_AND_DELETED' ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-mono">{r.subscriptionId}</span>
                        <span className="text-muted-foreground">
                          {r.status} {r.statusCode && `(${r.statusCode})`}
                        </span>
                        {r.message && <span className="text-red-600 text-xs">{r.message}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulação de Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Simular Eventos de Push
          </CardTitle>
          <CardDescription>
            Teste as notificações push para cada tipo de usuário e evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eventos para Admins */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Eventos para Admins (Webhook MercadoPago)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={() => testWebhookEvent('NEW_SUBSCRIBER')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'NEW_SUBSCRIBER' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="h-5 w-5 text-green-600" />
                )}
                <span className="text-xs font-medium">Novo Assinante</span>
              </Button>

              <Button
                onClick={() => testWebhookEvent('PAYMENT_CONFIRMED')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'PAYMENT_CONFIRMED' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5 text-blue-600" />
                )}
                <span className="text-xs font-medium">Pagamento OK</span>
              </Button>

              <Button
                onClick={() => testWebhookEvent('PAYMENT_OVERDUE')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'PAYMENT_OVERDUE' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <AlertOctagon className="h-5 w-5 text-orange-600" />
                )}
                <span className="text-xs font-medium">Pag. Atrasado</span>
              </Button>

              <Button
                onClick={() => testWebhookEvent('SUBSCRIPTION_EXPIRED')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'SUBSCRIPTION_EXPIRED' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <UserMinus className="h-5 w-5 text-red-600" />
                )}
                <span className="text-xs font-medium">Assin. Expirada</span>
              </Button>
            </div>
          </div>

          {/* Eventos para Assinantes */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Eventos para Assinantes (envia para todos os assinantes)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                onClick={() => testWebhookEvent('SUBSCRIBER_EXPIRING')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'SUBSCRIBER_EXPIRING' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-xs font-medium">Assin. Vencendo</span>
              </Button>

              <Button
                onClick={() => testWebhookEvent('NEW_BENEFIT')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'NEW_BENEFIT' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Gift className="h-5 w-5 text-purple-600" />
                )}
                <span className="text-xs font-medium">Novo Benefício</span>
              </Button>

              <Button
                onClick={() => testWebhookEvent('PROMOTION')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'PROMOTION' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Megaphone className="h-5 w-5 text-pink-600" />
                )}
                <span className="text-xs font-medium">Promoção</span>
              </Button>
            </div>
          </div>

          {/* Eventos para Parceiros */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Eventos para Parceiros (envia para todos os parceiros)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => testWebhookEvent('BENEFIT_USED')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'BENEFIT_USED' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                )}
                <span className="text-xs font-medium">Benefício Usado</span>
              </Button>

              <Button
                onClick={() => testWebhookEvent('PARTNER_ANNOUNCEMENT')}
                disabled={testingWebhook !== null}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                {testingWebhook === 'PARTNER_ANNOUNCEMENT' ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Megaphone className="h-5 w-5 text-blue-600" />
                )}
                <span className="text-xs font-medium">Comunicado</span>
              </Button>
            </div>
          </div>

          {/* Resultado do Webhook */}
          {webhookResult && (
            <div className={`p-4 rounded-lg ${webhookResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Resultado do Teste:
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>Evento: <strong>{webhookResult.eventType}</strong></div>
                <div className="text-green-600">Enviados: <strong>{webhookResult.sent}</strong></div>
                <div className="text-red-600">Falharam: <strong>{webhookResult.failed}</strong></div>
              </div>
              {webhookResult.errors?.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  Erros: {webhookResult.errors.join(', ')}
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <p className="font-medium mb-2">ℹ️ Como funciona:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Admins:</strong> Eventos do webhook MercadoPago (novos assinantes, pagamentos)</li>
              <li><strong>Assinantes:</strong> Enviado para TODOS os assinantes (role ASSINANTE)</li>
              <li><strong>Parceiros:</strong> Enviado para TODOS os parceiros (role PARCEIRO)</li>
              <li>Os dados exibidos são exemplos para teste</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Guia de Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Guia de Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cenário</th>
                  <th className="text-left p-2">O que significa</th>
                  <th className="text-left p-2">Próximo passo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">0 subscriptions</td>
                  <td className="p-2 text-muted-foreground">Push nunca foi registrado</td>
                  <td className="p-2">Verificar PushProvider e banner de permissão</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Subscriptions mas userId errado</td>
                  <td className="p-2 text-muted-foreground">Bug na sincronização</td>
                  <td className="p-2">Corrigir lógica de vinculação</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Teste retorna SUCCESS mas não recebe</td>
                  <td className="p-2 text-muted-foreground">Service Worker com problema</td>
                  <td className="p-2">Verificar sw.js</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Teste retorna 410</td>
                  <td className="p-2 text-muted-foreground">Subscription expirada</td>
                  <td className="p-2">Será removida automaticamente</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Teste retorna 403</td>
                  <td className="p-2 text-muted-foreground">VAPID keys inválidas</td>
                  <td className="p-2">Regenerar VAPID keys</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">VAPID não configurado</td>
                  <td className="p-2 text-muted-foreground">Variáveis ausentes</td>
                  <td className="p-2">Adicionar na Vercel</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Subscriptions Registradas
          </CardTitle>
          <CardDescription>
            Todos os dispositivos registrados para receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.subscriptions.length || 0) === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma subscription registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Usuário</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Provider</th>
                    <th className="text-left p-2">Plataforma</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Criado</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.subscriptions.map((sub) => (
                    <tr key={sub.id} className={`border-b hover:bg-muted/50 ${sub.isCurrentUser ? 'bg-blue-50' : ''}`}>
                      <td className="p-2 font-mono text-xs">{sub.visibleId}</td>
                      <td className="p-2">
                        <div className="font-medium">{sub.userName}</div>
                        <div className="text-xs text-muted-foreground">{sub.userEmail}</div>
                      </td>
                      <td className="p-2">
                        <Badge variant={sub.isCurrentUser ? 'default' : 'secondary'}>
                          {sub.userRole}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs">{sub.endpointProvider}</td>
                      <td className="p-2 text-xs">{sub.platform}</td>
                      <td className="p-2">
                        {sub.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Ativa</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">Inativa</Badge>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">
                        {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => testPush('specific', sub.id)}
                            disabled={testing}
                            title="Testar push"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSubscription(sub.id)}
                            disabled={deletingId === sub.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remover subscription"
                          >
                            {deletingId === sub.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
