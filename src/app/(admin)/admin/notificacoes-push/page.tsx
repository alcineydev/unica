'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Bell,
  Send,
  Loader2,
  Users,
  Store,
  Globe,
  CheckCircle,
  XCircle,
  Smartphone
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  link?: string
  targetType: string
  sentCount: number
  failedCount: number
  createdBy: string
  createdAt: string
}

interface Stats {
  total: number
  assinantes: number
  parceiros: number
}

export default function NotificacoesPushPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, assinantes: 0, parceiros: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [targetType, setTargetType] = useState('ALL')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/push')
      const data = await response.json()

      if (data.notifications) {
        setNotifications(data.notifications)
      }
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Preencha titulo e mensagem')
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || null,
          targetType
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Enviado para ${data.sentCount} dispositivos!`)
        setTitle('')
        setMessage('')
        setLink('')
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao enviar')
      }
    } catch (error) {
      toast.error('Erro ao enviar notificacao')
    } finally {
      setIsSending(false)
    }
  }

  const getTargetLabel = (type: string) => {
    switch (type) {
      case 'ALL': return 'Todos'
      case 'ASSINANTES': return 'Assinantes'
      case 'PARCEIROS': return 'Parceiros'
      default: return type
    }
  }

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'ALL': return <Globe className="h-4 w-4" />
      case 'ASSINANTES': return <Users className="h-4 w-4" />
      case 'PARCEIROS': return <Store className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR })
    } catch {
      return ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Notificacoes Push</h1>
        <p className="text-muted-foreground">Envie notificacoes para os dispositivos dos usuarios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Dispositivos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.assinantes}</p>
                <p className="text-xs text-muted-foreground">Assinantes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Store className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.parceiros}</p>
                <p className="text-xs text-muted-foreground">Parceiros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form de Envio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Notificacao
          </CardTitle>
          <CardDescription>
            A notificacao sera enviada para todos os dispositivos registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              placeholder="Ex: Nova promocao disponivel!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground text-right">{title.length}/50</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Ex: Aproveite 20% de desconto em todos os parceiros!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/200</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (opcional)</Label>
            <Input
              id="link"
              placeholder="Ex: /app/promocoes"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL para onde o usuario sera direcionado ao clicar
            </p>
          </div>

          <div className="space-y-2">
            <Label>Enviar para</Label>
            <RadioGroup value={targetType} onValueChange={setTargetType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ALL" id="all" />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="h-4 w-4" />
                  Todos ({stats.total} dispositivos)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ASSINANTES" id="assinantes" />
                <Label htmlFor="assinantes" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Apenas Assinantes ({stats.assinantes} dispositivos)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PARCEIROS" id="parceiros" />
                <Label htmlFor="parceiros" className="flex items-center gap-2 cursor-pointer">
                  <Store className="h-4 w-4" />
                  Apenas Parceiros ({stats.parceiros} dispositivos)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleSend}
            disabled={isSending || !title || !message}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Notificacao
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Historico */}
      <Card>
        <CardHeader>
          <CardTitle>Historico de Envios</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma notificacao enviada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{notif.title}</h4>
                      <Badge variant="outline" className="flex-shrink-0">
                        {getTargetIcon(notif.targetType)}
                        <span className="ml-1">{getTargetLabel(notif.targetType)}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {notif.sentCount} enviados
                      </span>
                      {notif.failedCount > 0 && (
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {notif.failedCount} falhas
                        </span>
                      )}
                      <span>•</span>
                      <span>{formatDate(notif.createdAt)}</span>
                      <span>•</span>
                      <span>{notif.createdBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
