'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Settings, Zap, Shield, CreditCard, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface TestResult {
  success: boolean
  message?: string
  error?: string
  account?: {
    name: string
    email: string
    environment: string
  }
}

export function AsaasConfig() {
  // Estado do formulário
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [webhookTokenInput, setWebhookTokenInput] = useState('')
  
  // Estado de dados salvos
  const [hasApiKey, setHasApiKey] = useState(false)
  const [hasWebhookToken, setHasWebhookToken] = useState(false)
  const [apiKeyMasked, setApiKeyMasked] = useState('')
  const [webhookTokenMasked, setWebhookTokenMasked] = useState('')
  
  // Estado de UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookToken, setShowWebhookToken] = useState(false)

  // Carregar configurações ao montar
  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      console.log('[AsaasConfig] Buscando configurações...')
      const response = await fetch('/api/admin/integrations/asaas')
      
      if (response.ok) {
        const data = await response.json()
        console.log('[AsaasConfig] Dados recebidos:', data)
        
        setEnvironment(data.environment || 'sandbox')
        setHasApiKey(data.hasApiKey || false)
        setHasWebhookToken(data.hasWebhookToken || false)
        setApiKeyMasked(data.apiKeyMasked || '')
        setWebhookTokenMasked(data.webhookTokenMasked || '')
        
        // Limpar inputs (usuário digita apenas se quiser alterar)
        setApiKeyInput('')
        setWebhookTokenInput('')
      } else {
        console.error('[AsaasConfig] Erro na resposta:', response.status)
      }
    } catch (error) {
      console.error('[AsaasConfig] Erro ao carregar:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setTestResult(null)

    try {
      const payload: Record<string, string> = { environment }
      
      // Só enviar se o usuário digitou algo novo
      if (apiKeyInput.trim()) {
        payload.apiKey = apiKeyInput.trim()
      }
      if (webhookTokenInput.trim()) {
        payload.webhookToken = webhookTokenInput.trim()
      }

      console.log('[AsaasConfig] Salvando:', { 
        environment, 
        hasNewApiKey: !!payload.apiKey, 
        hasNewWebhookToken: !!payload.webhookToken 
      })

      const response = await fetch('/api/admin/integrations/asaas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!')
        // Recarregar para mostrar dados atualizados
        await fetchConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('[AsaasConfig] Erro ao salvar:', error)
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
        toast.success('Conexão estabelecida com sucesso!')
      } else {
        toast.error(result.error || 'Falha na conexão')
      }
    } catch (error) {
      console.error('[AsaasConfig] Erro ao testar:', error)
      setTestResult({ success: false, error: 'Erro ao testar conexão' })
      toast.error('Erro ao testar conexão')
    } finally {
      setTesting(false)
    }
  }

  const copyWebhookUrl = () => {
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/webhooks/asaas`
      : ''
    navigator.clipboard.writeText(url)
    toast.success('URL copiada!')
  }

  // Gerar URL do webhook com bypass para Vercel Protection
  const getWebhookUrl = () => {
    if (typeof window === 'undefined') return ''
    
    const baseUrl = `${window.location.origin}/api/webhooks/asaas`
    
    // Bypass para Vercel Deployment Protection
    const bypassSecret = 'unicawebhookbypass2026asaasdev01'
    
    // Em dev/preview, adicionar o bypass
    if (window.location.hostname.includes('dev.') || window.location.hostname.includes('vercel.app')) {
      return `${baseUrl}?x-vercel-protection-bypass=${bypassSecret}`
    }
    
    return baseUrl
  }

  const webhookUrl = getWebhookUrl()

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Asaas</CardTitle>
              <CardDescription className="text-blue-100">
                Gateway de pagamentos e cobranças
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasApiKey && (
              <Badge className="bg-green-500 hover:bg-green-600">
                Configurado
              </Badge>
            )}
            <Badge 
              variant={environment === 'production' ? 'default' : 'secondary'}
              className={environment === 'production' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
              }
            >
              {environment === 'production' ? '🔴 Produção' : '🟡 Sandbox'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Ambiente */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ambiente
          </Label>
          <RadioGroup
            value={environment}
            onValueChange={(value) => setEnvironment(value as 'sandbox' | 'production')}
            className="grid grid-cols-2 gap-4"
          >
            <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
              environment === 'sandbox' 
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <RadioGroupItem value="sandbox" id="sandbox" />
              <Label htmlFor="sandbox" className="cursor-pointer flex-1">
                <div className="font-medium">Sandbox</div>
                <div className="text-xs text-muted-foreground">Para testes</div>
              </Label>
            </div>
            <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
              environment === 'production' 
                ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <RadioGroupItem value="production" id="production" />
              <Label htmlFor="production" className="cursor-pointer flex-1">
                <div className="font-medium">Produção</div>
                <div className="text-xs text-muted-foreground">Pagamentos reais</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="apiKey" className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              API Key
            </Label>
            {hasApiKey && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Salva
              </Badge>
            )}
          </div>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              placeholder={hasApiKey ? `Atual: ${apiKeyMasked} (deixe vazio para manter)` : 'Cole sua API Key do Asaas'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className={`pr-10 font-mono text-sm ${hasApiKey ? 'bg-green-50 border-green-200' : ''}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Encontre em: Asaas → Minha Conta → Integrações → API
          </p>
        </div>

        {/* Webhook Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhookToken" className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Webhook Token
            </Label>
            {hasWebhookToken && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Salvo
              </Badge>
            )}
          </div>
          <div className="relative">
            <Input
              id="webhookToken"
              type={showWebhookToken ? 'text' : 'password'}
              placeholder={hasWebhookToken ? `Atual: ${webhookTokenMasked} (deixe vazio para manter)` : 'Token para validar webhooks'}
              value={webhookTokenInput}
              onChange={(e) => setWebhookTokenInput(e.target.value)}
              className={`pr-10 font-mono text-sm ${hasWebhookToken ? 'bg-green-50 border-green-200' : ''}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowWebhookToken(!showWebhookToken)}
            >
              {showWebhookToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Usado para validar a autenticidade das notificações recebidas
          </p>
        </div>

        {/* URL do Webhook */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">URL do Webhook</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={webhookUrl}
              className="font-mono text-sm bg-muted"
            />
            <Button
              type="button"
              variant="outline"
              onClick={copyWebhookUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure esta URL no painel do Asaas: Configurações → Integrações → Webhooks
          </p>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {testResult.success ? (
                  <div>
                    <p className="font-medium">{testResult.message}</p>
                    {testResult.account && (
                      <p className="text-sm mt-1">
                        Conta: {testResult.account.name} ({testResult.account.email})
                      </p>
                    )}
                  </div>
                ) : (
                  testResult.error
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !hasApiKey}
            className="flex-1"
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
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
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
