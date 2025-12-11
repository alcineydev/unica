'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Plus, 
  Loader2, 
  Send, 
  Trash2,
  MessageCircle,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Phone
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  imageUrl: string | null
  linkUrl: string | null
  linkText: string | null
  targetType: string
  targetPlanId: string | null
  targetCityId: string | null
  individualNumber: string | null
  instanceId: string
  status: string
  sentCount: number
  failedCount: number
  sentAt: string | null
  createdAt: string
  instance?: {
    name: string
  }
  targetPlan?: {
    name: string
  }
  targetCity?: {
    name: string
  }
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  'INDIVIDUAL': 'Número Individual',
  'ALL_ASSINANTES': 'Todos os Assinantes',
  'PLANO_ESPECIFICO': 'Assinantes do Plano',
  'ALL_PARCEIROS': 'Todos os Parceiros',
  'PARCEIROS_CIDADE': 'Parceiros da Cidade',
  'TODOS': 'Todos (Assinantes + Parceiros)',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  'DRAFT': { label: 'Rascunho', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  'SCHEDULED': { label: 'Agendada', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  'SENDING': { label: 'Enviando', variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  'SENT': { label: 'Enviada', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  'PARTIAL': { label: 'Parcial', variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> },
  'FAILED': { label: 'Falhou', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
}

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todas')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const response = await fetch('/api/admin/notificacoes')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/notificacoes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Notificação excluída')
        loadNotifications()
      } else {
        toast.error('Erro ao excluir notificação')
      }
    } catch (error) {
      toast.error('Erro ao excluir notificação')
    }
  }

  async function handleResend(id: string) {
    try {
      const response = await fetch(`/api/admin/notificacoes/${id}/enviar`, {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Notificação reenviada! ${result.sentCount} enviada(s), ${result.failedCount} falharam`)
        loadNotifications()
      } else {
        toast.error(result.error || 'Erro ao reenviar notificação')
      }
    } catch (error) {
      toast.error('Erro ao reenviar notificação')
    }
  }

  function getFilteredNotifications() {
    switch (activeTab) {
      case 'enviadas':
        return notifications.filter(n => n.status === 'SENT' || n.status === 'PARTIAL')
      case 'rascunhos':
        return notifications.filter(n => n.status === 'DRAFT')
      case 'agendadas':
        return notifications.filter(n => n.status === 'SCHEDULED')
      default:
        return notifications
    }
  }

  function getTargetLabel(notification: Notification) {
    if (notification.targetType === 'INDIVIDUAL' && notification.individualNumber) {
      // Formata o número para exibição
      const num = notification.individualNumber
      if (num.length === 11) {
        return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`
      }
      return num
    }
    
    let label = TARGET_TYPE_LABELS[notification.targetType] || notification.targetType
    if (notification.targetPlan) {
      label += ` - ${notification.targetPlan.name}`
    }
    if (notification.targetCity) {
      label += ` - ${notification.targetCity.name}`
    }
    return label
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            Envie notificações em massa para assinantes e parceiros
          </p>
        </div>
        <Link href="/admin/notificacoes/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Notificação
          </Button>
        </Link>
      </div>

      {/* Lista de Notificações */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="enviadas">Enviadas</TabsTrigger>
              <TabsTrigger value="rascunhos">Rascunhos</TabsTrigger>
              <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {getFilteredNotifications().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Crie sua primeira notificação para enviar aos seus clientes
              </p>
              <Link href="/admin/notificacoes/nova">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Notificação
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredNotifications().map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">WhatsApp</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {notification.targetType === 'INDIVIDUAL' && (
                          <Phone className="h-3 w-3 text-blue-500" />
                        )}
                        <span className="text-sm">{getTargetLabel(notification)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={STATUS_CONFIG[notification.status]?.variant || 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {STATUS_CONFIG[notification.status]?.icon}
                        {STATUS_CONFIG[notification.status]?.label || notification.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notification.status !== 'DRAFT' && (
                        <span className="text-sm">
                          {notification.sentCount} ✓ / {notification.failedCount} ✗
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {notification.sentAt 
                          ? new Date(notification.sentAt).toLocaleString('pt-BR')
                          : new Date(notification.createdAt).toLocaleString('pt-BR')
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {notification.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResend(notification.id)}
                            title="Enviar"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {(notification.status === 'PARTIAL' || notification.status === 'FAILED') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResend(notification.id)}
                            title="Reenviar"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir notificação?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => handleDelete(notification.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
