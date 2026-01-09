'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Clock,
  Play,
  Mail,
  MessageSquare,
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface CronResult {
  success: boolean
  processed: number
  results: Array<{
    assinante: string
    daysLeft: number
    notifications: Array<{
      channel: string
      success: boolean
      error?: string
    }>
  }>
  executedAt: string
  error?: string
}

export default function CronPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CronResult | null>(null)
  const [channels, setChannels] = useState({
    email: true,
    whatsapp: true,
    push: true
  })
  const [days, setDays] = useState({
    d7: true,
    d3: true,
    d1: true,
    d0: true
  })

  const executeCron = async () => {
    setLoading(true)
    setResult(null)

    try {
      const selectedChannels = Object.entries(channels)
        .filter(([, enabled]) => enabled)
        .map(([channel]) => channel)

      const selectedDays = []
      if (days.d7) selectedDays.push(7)
      if (days.d3) selectedDays.push(3)
      if (days.d1) selectedDays.push(1)
      if (days.d0) selectedDays.push(0)

      if (selectedChannels.length === 0) {
        toast.error('Selecione pelo menos um canal')
        setLoading(false)
        return
      }

      if (selectedDays.length === 0) {
        toast.error('Selecione pelo menos um período')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/cron/vencimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: selectedChannels,
          daysBeforeExpiration: selectedDays
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast.success(`Cron executado! ${data.processed} assinante(s) notificado(s)`)
      } else {
        toast.error(data.error || 'Erro ao executar cron')
      }

    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao executar cron')
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />
      case 'whatsapp': return <MessageSquare className="h-3 w-3" />
      case 'push': return <Bell className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Cron de Vencimentos
        </h1>
        <p className="text-muted-foreground">
          Notifica assinantes sobre assinaturas vencendo por Email, WhatsApp e Push
        </p>
      </div>

      {/* Status do Cron */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamento Automático
          </CardTitle>
          <CardDescription>
            O cron executa automaticamente todos os dias às 9h (horário de Brasília)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
            <span className="text-sm text-muted-foreground">
              Agendamento: 12:00 UTC (09:00 Brasília)
            </span>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            O cron verifica assinantes com vencimento em 7, 3, 1 dias e no dia do vencimento.
          </div>
        </CardContent>
      </Card>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Execução Manual</CardTitle>
          <CardDescription>
            Execute o cron manualmente com configurações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Canais */}
          <div>
            <h4 className="font-medium mb-3">Canais de Notificação</h4>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={channels.email}
                  onCheckedChange={(c) => setChannels({ ...channels, email: !!c })}
                />
                <Mail className="h-4 w-4 text-blue-500" />
                <span>Email (Resend)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={channels.whatsapp}
                  onCheckedChange={(c) => setChannels({ ...channels, whatsapp: !!c })}
                />
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span>WhatsApp (Evolution)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={channels.push}
                  onCheckedChange={(c) => setChannels({ ...channels, push: !!c })}
                />
                <Bell className="h-4 w-4 text-purple-500" />
                <span>Push Notification</span>
              </label>
            </div>
          </div>

          {/* Dias */}
          <div>
            <h4 className="font-medium mb-3">Notificar quando faltar</h4>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={days.d7}
                  onCheckedChange={(c) => setDays({ ...days, d7: !!c })}
                />
                <span>7 dias</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={days.d3}
                  onCheckedChange={(c) => setDays({ ...days, d3: !!c })}
                />
                <span>3 dias</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={days.d1}
                  onCheckedChange={(c) => setDays({ ...days, d1: !!c })}
                />
                <span>1 dia</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={days.d0}
                  onCheckedChange={(c) => setDays({ ...days, d0: !!c })}
                />
                <span>No dia do vencimento</span>
              </label>
            </div>
          </div>

          {/* Botão Executar */}
          <Button onClick={executeCron} disabled={loading} size="lg" className="mt-4">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado da Execução
            </CardTitle>
            <CardDescription>
              Executado em {new Date(result.executedAt).toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {result.error}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Badge variant={result.processed > 0 ? 'default' : 'secondary'}>
                    {result.processed} assinante(s) processado(s)
                  </Badge>
                </div>

                {result.results && result.results.length > 0 ? (
                  <div className="space-y-3">
                    {result.results.map((r, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{r.assinante}</span>
                          <Badge variant="outline">
                            {r.daysLeft === 0 ? 'Vence hoje' : `${r.daysLeft} dia(s)`}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {r.notifications.map((n, j) => (
                            <Badge
                              key={j}
                              variant={n.success ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {getChannelIcon(n.channel)}
                              <span className="ml-1">
                                {n.success ? '✓' : '✗'} {n.channel}
                              </span>
                              {n.error && (
                                <span className="ml-1 opacity-75">({n.error})</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum assinante com vencimento nos períodos selecionados.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Email:</strong> Envia lembrete usando Resend. Requer RESEND_API_KEY configurado.
          </p>
          <p>
            <strong>WhatsApp:</strong> Envia mensagem via Evolution API usando a instância padrão conectada.
          </p>
          <p>
            <strong>Push:</strong> Envia notificação push para dispositivos registrados do assinante.
          </p>
          <p className="pt-2 border-t">
            O cron automático roda diariamente às 9h (Brasília) e notifica assinantes que vencem em 7, 3, 1 dias e no dia.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
