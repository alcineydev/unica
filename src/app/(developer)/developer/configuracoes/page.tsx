'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Eye, EyeOff, Save, RefreshCw, Database, Server, Shield, MessageSquare } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  
  const [config, setConfig] = useState({
    evolution_api_url: '',
    evolution_api_key: '',
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/developer/configs')
      if (response.ok) {
        const data = await response.json()
        
        const configMap: Record<string, string> = {}
        data.forEach((c: { key: string; value: string }) => {
          configMap[c.key] = c.value
        })
        
        setConfig({
          evolution_api_url: configMap.evolution_api_url || '',
          evolution_api_key: configMap.evolution_api_key || '',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configs:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  async function saveConfigs() {
    setSaving(true)
    try {
      const response = await fetch('/api/developer/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      
      if (response.ok) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    setTestingConnection(true)
    try {
      const response = await fetch('/api/developer/test-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.evolution_api_url,
          apiKey: config.evolution_api_key,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Conexão estabelecida! ${data.instances} instância(s) encontrada(s)`)
      } else {
        toast.error(data.error || 'Falha na conexão')
      }
    } catch (error) {
      console.error('Erro ao testar:', error)
      toast.error('Erro ao testar conexão')
    } finally {
      setTestingConnection(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  const systemInfo = {
    version: '1.0.0',
    nextVersion: '16.0.7',
    prismaVersion: '5.22.0',
    database: 'PostgreSQL (Supabase)',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 mt-1">
          Configurações avançadas do sistema
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolution API */}
        <Card className="bg-zinc-800 border-zinc-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Evolution API (WhatsApp)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configure as credenciais para integração com WhatsApp via Evolution API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api_url" className="text-zinc-300">URL da API</Label>
                <Input
                  id="api_url"
                  placeholder="https://api.exemplo.com"
                  value={config.evolution_api_url}
                  onChange={(e) => setConfig({ ...config, evolution_api_url: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key" className="text-zinc-300">API Key</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Sua API Key"
                    value={config.evolution_api_key}
                    onChange={(e) => setConfig({ ...config, evolution_api_key: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={saveConfigs} 
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button 
                variant="outline" 
                onClick={testConnection} 
                disabled={testingConnection || !config.evolution_api_url || !config.evolution_api_key}
                className="border-zinc-700 text-zinc-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${testingConnection ? 'animate-spin' : ''}`} />
                {testingConnection ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Versão do App</span>
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                v{systemInfo.version}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Next.js</span>
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                v{systemInfo.nextVersion}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Prisma ORM</span>
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                v{systemInfo.prismaVersion}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Ambiente</span>
              <Badge className="bg-amber-600">
                {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Provedor</span>
              <span className="text-white">{systemInfo.database}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Pooling</span>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">SSL</span>
              <Badge className="bg-green-600">Habilitado</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Status</span>
              <Badge className="bg-green-600">Conectado</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-zinc-800 border-zinc-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">Autenticação</span>
                <span className="text-white">NextAuth.js v5</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">Estratégia</span>
                <span className="text-white">JWT</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">Hash de Senhas</span>
                <span className="text-white">bcrypt (12 rounds)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-lg">
                <span className="text-zinc-400">RBAC</span>
                <Badge className="bg-green-600">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
