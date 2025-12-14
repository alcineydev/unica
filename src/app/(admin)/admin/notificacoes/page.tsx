'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Phone,
  MoreHorizontal,
  Users,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; className: string }> = {
  'DRAFT': { label: 'Rascunho', variant: 'secondary', icon: <Clock className="h-3 w-3" />, className: 'bg-gray-100 text-gray-700 border-0' },
  'SCHEDULED': { label: 'Agendada', variant: 'outline', icon: <Clock className="h-3 w-3" />, className: 'bg-blue-100 text-blue-700 border-0' },
  'SENDING': { label: 'Enviando', variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" />, className: 'bg-yellow-100 text-yellow-700 border-0' },
  'SENT': { label: 'Enviada', variant: 'default', icon: <CheckCircle className="h-3 w-3" />, className: 'bg-green-100 text-green-700 border-0' },
  'PARTIAL': { label: 'Parcial', variant: 'outline', icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-orange-100 text-orange-700 border-0' },
  'FAILED': { label: 'Falhou', variant: 'destructive', icon: <XCircle className="h-3 w-3" />, className: 'bg-red-100 text-red-700 border-0' },
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
    } catch {
      toast.error('Erro ao excluir notificação')
    }
  }

  async function handleSend(id: string) {
    try {
      const response = await fetch(`/api/admin/notificacoes/${id}/enviar`, {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Notificação enviada! ${result.sentCount} enviada(s), ${result.failedCount} falharam`)
        loadNotifications()
      } else {
        toast.error(result.error || 'Erro ao enviar notificação')
      }
    } catch {
      toast.error('Erro ao enviar notificação')
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

  const filteredNotifications = getFilteredNotifications()

  return (
    <div className="space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Notificações</h1>
          <p className="text-sm text-muted-foreground">Envie notificações para assinantes e parceiros</p>
        </div>
        <Link href="/admin/notificacoes/nova">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Notificação
          </Button>
        </Link>
      </div>

      {/* Tabs responsivas */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          <Button 
            variant={activeTab === 'todas' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('todas')}
          >
            Todas
          </Button>
          <Button 
            variant={activeTab === 'enviadas' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('enviadas')}
          >
            Enviadas
          </Button>
          <Button 
            variant={activeTab === 'rascunhos' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('rascunhos')}
          >
            Rascunhos
          </Button>
          <Button 
            variant={activeTab === 'agendadas' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('agendadas')}
          >
            Agendadas
          </Button>
        </div>
      </div>

      {/* Listagem */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground text-sm mb-4 text-center">
              Crie sua primeira notificação para enviar aos seus clientes
            </p>
            <Link href="/admin/notificacoes/nova">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Notificação
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Header do card */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" /> 
                          WhatsApp
                        </Badge>
                        <Badge 
                          variant={STATUS_CONFIG[notification.status]?.variant || 'secondary'}
                          className={cn(
                            "flex items-center gap-1",
                            STATUS_CONFIG[notification.status]?.className
                          )}
                        >
                          {STATUS_CONFIG[notification.status]?.icon}
                          {STATUS_CONFIG[notification.status]?.label || notification.status}
                        </Badge>
                      </div>

                      {/* Título */}
                      <p className="font-semibold mb-1">{notification.title}</p>
                      
                      {/* Preview da mensagem */}
                      {notification.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                      )}

                      {/* Destinatários e Data */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {notification.targetType === 'INDIVIDUAL' ? (
                            <Phone className="h-3 w-3" />
                          ) : (
                            <Users className="h-3 w-3" />
                          )}
                          {getTargetLabel(notification)}
                        </span>
                        {notification.sentAt && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(notification.sentAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        )}
                        {notification.status !== 'DRAFT' && (
                          <>
                            <span>•</span>
                            <span>{notification.sentCount} ✓ / {notification.failedCount} ✗</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Menu de ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(notification.status === 'DRAFT' || notification.status === 'PARTIAL' || notification.status === 'FAILED') && (
                          <DropdownMenuItem onClick={() => handleSend(notification.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            {notification.status === 'DRAFT' ? 'Enviar' : 'Reenviar'}
                          </DropdownMenuItem>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {notification.message}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {notification.targetType === 'INDIVIDUAL' && (
                          <Phone className="h-3 w-3 text-blue-500" />
                        )}
                        {getTargetLabel(notification)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={STATUS_CONFIG[notification.status]?.variant || 'secondary'}
                        className={cn(
                          "flex items-center gap-1 w-fit",
                          STATUS_CONFIG[notification.status]?.className
                        )}
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
                          ? new Date(notification.sentAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {(notification.status === 'DRAFT' || notification.status === 'PARTIAL' || notification.status === 'FAILED') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSend(notification.id)}
                            title={notification.status === 'DRAFT' ? 'Enviar' : 'Reenviar'}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
          </div>
        </>
      )}
    </div>
  )
}
