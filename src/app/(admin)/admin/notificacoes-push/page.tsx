'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Bell,
  Send,
  Loader2,
  Users,
  Store,
  Globe,
  CheckCircle,
  XCircle,
  Smartphone,
  Shield,
  Search,
  X,
  Filter,
  Trash2,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'
import { PageLoading } from '@/components/admin/loading-spinner'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BulkActionsToolbar, type BulkAction } from '@/components/admin/bulk-actions'
import { cn } from '@/lib/utils'

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
  admins: number
}

export default function NotificacoesPushPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, assinantes: 0, parceiros: 0, admins: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [targetType, setTargetType] = useState('ALL')

  // Estados de filtro
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState('all')

  // Estados de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

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
      case 'ADMINS': return 'Admins'
      default: return type
    }
  }

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'ALL': return <Globe className="h-4 w-4" />
      case 'ASSINANTES': return <Users className="h-4 w-4" />
      case 'PARCEIROS': return <Store className="h-4 w-4" />
      case 'ADMINS': return <Shield className="h-4 w-4" />
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

  // Constantes de tipos de destinatário
  const TARGET_TYPES = [
    { value: 'ALL', label: 'Todos', icon: Globe },
    { value: 'ASSINANTES', label: 'Assinantes', icon: Users },
    { value: 'PARCEIROS', label: 'Parceiros', icon: Building2 },
    { value: 'ADMINS', label: 'Administradores', icon: Shield },
  ]

  // Filtrar histórico
  const filteredHistory = notifications.filter(notification => {
    const matchesSearch = search === '' ||
      notification.title?.toLowerCase().includes(search.toLowerCase()) ||
      notification.message?.toLowerCase().includes(search.toLowerCase())

    const matchesTarget = targetFilter === 'all' || notification.targetType === targetFilter

    return matchesSearch && matchesTarget
  })

  // Funções de seleção
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredHistory.map(n => n.id))
    }
    setSelectAll(!selectAll)
  }

  // Limpar seleção quando filtros mudam
  useEffect(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [search, targetFilter])

  // Função de bulk action
  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/push/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na operação')
      }

      toast.success(data.message)
      setSelectedIds([])
      setSelectAll(false)
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro na operação')
    }
  }

  // Ações em lote
  const bulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      requiresConfirmation: true,
      onClick: async () => { await handleBulkAction('delete') }
    }
  ]

  if (isLoading) {
    return <PageLoading text="Carregando push..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Notificacoes Push</h1>
        <p className="text-muted-foreground">Envie notificacoes para os dispositivos dos usuarios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
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
              <div className="p-2 bg-green-100 rounded-lg">
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Store className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.parceiros}</p>
                <p className="text-xs text-muted-foreground">Parceiros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ADMINS" id="admins" />
                <Label htmlFor="admins" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4" />
                  Apenas Admins ({stats.admins} dispositivos)
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

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Histórico de Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou mensagem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearch('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filtro de Destinatário */}
            <Select value={targetFilter} onValueChange={setTargetFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Destinatário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TARGET_TYPES.map((target) => (
                  <SelectItem key={target.value} value={target.value}>
                    {target.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumo de filtros */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              {(targetFilter !== 'all' || search) && (
                <>
                  <Badge variant="secondary">
                    <Filter className="h-3 w-3 mr-1" />
                    Filtros ativos
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setTargetFilter('all')
                    }}
                  >
                    Limpar
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredHistory.length} notificação(ões)
            </p>
          </div>

          {/* Toolbar de Ações em Lote */}
          <BulkActionsToolbar
            selectedIds={selectedIds}
            actions={bulkActions}
            itemType="notificação push"
            onClearSelection={() => { setSelectedIds([]); setSelectAll(false) }}
          />

          {/* Tabela Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll && filteredHistory.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Notificação</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead className="text-center">Sucesso</TableHead>
                  <TableHead className="text-center">Falhas</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((notification) => {
                    const targetConfig = TARGET_TYPES.find(t => t.value === notification.targetType)
                    const TargetIcon = targetConfig?.icon || Users

                    return (
                      <TableRow
                        key={notification.id}
                        className={cn(selectedIds.includes(notification.id) && 'bg-blue-50/50')}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(notification.id)}
                            onCheckedChange={() => toggleSelect(notification.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {notification.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <TargetIcon className="h-3 w-3" />
                            {targetConfig?.label || notification.targetType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 font-medium">
                            {notification.sentCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={notification.failedCount > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                            {notification.failedCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {notification.createdAt
                            ? format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
              </div>
            ) : (
              filteredHistory.map((notification) => {
                const targetConfig = TARGET_TYPES.find(t => t.value === notification.targetType)
                const TargetIcon = targetConfig?.icon || Users

                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedIds.includes(notification.id) && "ring-2 ring-blue-500 bg-blue-50/50"
                    )}
                    onClick={() => toggleSelect(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={() => toggleSelect(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium truncate">{notification.title}</h3>
                            <Badge variant="outline" className="gap-1 ml-2 flex-shrink-0">
                              <TargetIcon className="h-3 w-3" />
                              {targetConfig?.label || notification.targetType}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              {notification.sentCount || 0}
                            </span>
                            {notification.failedCount > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                {notification.failedCount}
                              </span>
                            )}
                            <span className="text-muted-foreground ml-auto">
                              {notification.createdAt
                                ? format(new Date(notification.createdAt), "dd/MM HH:mm", { locale: ptBR })
                                : '-'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
