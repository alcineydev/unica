'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Zap, 
  Shield, 
  CreditCard,
  Copy,
  AlertTriangle,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'

interface AsaasConfig {
  environment: 'sandbox' | 'production'
  apiKey: string
  apiKeyMasked: string
  webhookToken: string
  webhookTokenMasked: string
  hasApiKey: boolean
  hasWebhookToken: boolean
}

interface TestResult {
  success: boolean
  message?: string
  error?: string
  account?: {
    name: string
    email: string
    cpfCnpj?: string
    environment: string
    walletId?: string
  }
}

export function AsaasConfig() {
  const [config, setConfig] = useState<AsaasConfig>({
    environment: 'sandbox',
    apiKey: '',
    apiKeyMasked: '',
    webhookToken: '',
    webhookTokenMasked: '',
    hasApiKey: false,
    hasWebhookToken: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookToken, setShowWebhookToken] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Carregar configurações
  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/integrations/asaas')
      if (response.ok) {
        const data = await response.json()
        setConfig({
          environment: data.environment || 'sandbox',
          apiKey: '',
          apiKeyMasked: data.apiKeyMasked || '',
          webhookToken: '',
          webhookTokenMasked: data.webhookTokenMasked || '',
          hasApiKey: data.hasApiKey || false,
          hasWebhookToken: data.hasWebhookToken || false,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações do Asaas')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/integrations/asaas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: config.environment,
          apiKey: config.apiKey || undefined,
          webhookToken: config.webhookToken || undefined
        })
      })

      if (response.ok) {
        toast.success('Configurações do Asaas salvas com sucesso!')
        setHasChanges(false)
        // Recarregar para atualizar máscaras
        fetchConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/integrations/asaas/test', {
        method: 'POST'
      })

      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast.success('Conexão com Asaas estabelecida!')
      } else {
        toast.error(result.error || 'Falha na conexão')
      }
    } catch (error) {
      console.error('Erro ao testar:', error)
      setTestResult({ success: false, error: 'Erro ao testar conexão' })
      toast.error('Erro ao testar conexão')
    } finally {
      setTesting(false)
    }
  }

  const updateConfig = (field: keyof AsaasConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    setTestResult(null)
  }

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/asaas`
    : ''

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiada!`)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      {/* Header com gradiente azul Asaas */}
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Asaas</CardTitle>
              <CardDescription className="text-blue-100">
                Gateway de pagamentos e cobranças
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.hasApiKey && (
              <Badge className="bg-green-500/90 hover:bg-green-600 text-white border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            )}
            <Badge 
              className={config.environment === 'production' 
                ? 'bg-red-500/90 hover:bg-red-600 text-white border-0' 
                : 'bg-amber-500/90 hover:bg-amber-600 text-white border-0'
              }
            >
              {config.environment === 'production' ? '🔴 Produção' : '🟡 Sandbox'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Ambiente */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
            <Building2 className="h-4 w-4" />
            Ambiente de Operação
          </Label>
          <RadioGroup
            value={config.environment}
            onValueChange={(value) => updateConfig('environment', value)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div 
              className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                config.environment === 'sandbox' 
                  ? 'border-amber-500 bg-amber-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => updateConfig('environment', 'sandbox')}
            >
              <RadioGroupItem value="sandbox" id="asaas-sandbox" className="text-amber-600" />
              <Label htmlFor="asaas-sandbox" className="cursor-pointer flex-1">
                <div className="font-semibold text-gray-800">🟡 Sandbox</div>
                <div className="text-xs text-gray-500 mt-0.5">Para testes e desenvolvimento</div>
              </Label>
            </div>
            <div 
              className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                config.environment === 'production' 
                  ? 'border-red-500 bg-red-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => updateConfig('environment', 'production')}
            >
              <RadioGroupItem value="production" id="asaas-production" className="text-red-600" />
              <Label htmlFor="asaas-production" className="cursor-pointer flex-1">
                <div className="font-semibold text-gray-800">🔴 Produção</div>
                <div className="text-xs text-gray-500 mt-0.5">Cobranças reais ativadas</div>
              </Label>
            </div>
          </RadioGroup>
          
          {config.environment === 'production' && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm ml-2">
                <strong>Atenção:</strong> Modo produção ativo! Todas as cobranças serão reais.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="asaas-apiKey" className="text-sm font-semibold flex items-center gap-2 text-gray-700">
            <Shield className="h-4 w-4" />
            API Key
            {config.hasApiKey && (
              <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                Configurada
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="asaas-apiKey"
              type={showApiKey ? 'text' : 'password'}
              placeholder={config.apiKeyMasked || 'Cole sua API Key do Asaas aqui...'}
              value={config.apiKey}
              onChange={(e) => updateConfig('apiKey', e.target.value)}
              className="pr-12 font-mono text-sm h-11 border-2 focus:border-blue-500 transition-colors"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Encontre em: <strong>Asaas</strong> → Minha Conta → Integrações → API
          </p>
        </div>

        {/* Webhook Token */}
        <div className="space-y-2">
          <Label htmlFor="asaas-webhookToken" className="text-sm font-semibold flex items-center gap-2 text-gray-700">
            <Zap className="h-4 w-4" />
            Webhook Token (Opcional)
            {config.hasWebhookToken && (
              <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                Configurado
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="asaas-webhookToken"
              type={showWebhookToken ? 'text' : 'password'}
              placeholder={config.webhookTokenMasked || 'Token para validar webhooks (opcional)'}
              value={config.webhookToken}
              onChange={(e) => updateConfig('webhookToken', e.target.value)}
              className="pr-12 font-mono text-sm h-11 border-2 focus:border-blue-500 transition-colors"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setShowWebhookToken(!showWebhookToken)}
            >
              {showWebhookToken ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Usado para validar a autenticidade das notificações recebidas
          </p>
        </div>

        {/* URL do Webhook */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <Label className="text-sm font-semibold text-gray-700">URL do Webhook</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={webhookUrl}
              className="font-mono text-sm bg-white h-11 border-2"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4 border-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
              onClick={() => copyToClipboard(webhookUrl, 'URL')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Configure esta URL no painel do Asaas: <strong>Configurações</strong> → <strong>Integrações</strong> → <strong>Webhooks</strong>
          </p>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <Alert 
            className={testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
            }
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.success ? (
                  <div>
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.account && (
                      <div className="mt-2 text-sm space-y-1">
                        <p>
                          <span className="text-gray-600">Conta:</span>{' '}
                          <strong>{testResult.account.name}</strong>
                        </p>
                        <p>
                          <span className="text-gray-600">Email:</span>{' '}
                          {testResult.account.email}
                        </p>
                        <p>
                          <span className="text-gray-600">Ambiente:</span>{' '}
                          <Badge variant="secondary" className="ml-1">
                            {testResult.account.environment === 'production' ? 'Produção' : 'Sandbox'}
                          </Badge>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <span>{testResult.error}</span>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || (!config.hasApiKey && !config.apiKey)}
            className="flex-1 h-11 border-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Testar Conexão
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

