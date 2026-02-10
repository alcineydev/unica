'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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
    Search,
    X,
    Filter,
    Trash2,
    CheckCheck,
    Loader2,
    User,
    Building2,
    CreditCard,
    Clock,
    AlertTriangle,
    XCircle,
    ExternalLink,
    RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { BulkActionsToolbar, type BulkAction } from '@/components/admin/bulk-actions/bulk-actions-toolbar'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface AdminNotification {
    id: string
    type: string
    title: string
    message: string
    data?: Record<string, unknown>
    actionUrl?: string
    isRead: boolean
    readAt?: string
    priority: string
    createdAt: string
}

const NOTIFICATION_TYPES = [
    { value: 'NEW_SUBSCRIBER', label: 'Novo Assinante', icon: User, color: 'text-green-600 bg-green-100' },
    { value: 'NEW_PARTNER', label: 'Novo Parceiro', icon: Building2, color: 'text-blue-600 bg-blue-100' },
    { value: 'TRANSACTION', label: 'Transação', icon: CreditCard, color: 'text-purple-600 bg-purple-100' },
    { value: 'EXPIRING_SOON', label: 'Expirando', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    { value: 'EXPIRING_TODAY', label: 'Vence Hoje', icon: AlertTriangle, color: 'text-orange-600 bg-orange-100' },
    { value: 'EXPIRED', label: 'Expirado', icon: XCircle, color: 'text-red-600 bg-red-100' },
    { value: 'PAYMENT_RECEIVED', label: 'Pagamento OK', icon: CreditCard, color: 'text-green-600 bg-green-100' },
    { value: 'PAYMENT_FAILED', label: 'Pagamento Falhou', icon: XCircle, color: 'text-red-600 bg-red-100' },
    { value: 'SYSTEM', label: 'Sistema', icon: Bell, color: 'text-gray-600 bg-gray-100' },
]

const PRIORITY_STYLES: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
}

export default function NotificacoesSistemaPage() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectAll, setSelectAll] = useState(false)

    // Carregar notificações
    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/notifications?limit=100')
            if (response.ok) {
                const data = await response.json()
                setNotifications(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error)
            toast.error('Erro ao carregar notificações')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Filtrar notificações
    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = search === '' ||
            notification.title?.toLowerCase().includes(search.toLowerCase()) ||
            notification.message?.toLowerCase().includes(search.toLowerCase())

        const matchesType = typeFilter === 'all' || notification.type === typeFilter

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'read' && notification.isRead) ||
            (statusFilter === 'unread' && !notification.isRead)

        return matchesSearch && matchesType && matchesStatus
    })

    // Handlers de seleção
    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id))
        }
        setSelectAll(!selectAll)
    }

    useEffect(() => {
        setSelectedIds([])
        setSelectAll(false)
    }, [search, typeFilter, statusFilter])

    // Marcar como lidas em lote
    const handleMarkAsRead = async () => {
        try {
            const promises = selectedIds.map(id =>
                fetch(`/api/admin/notifications/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isRead: true })
                })
            )
            await Promise.all(promises)
            toast.success(`${selectedIds.length} notificação(ões) marcada(s) como lida(s)`)
            setSelectedIds([])
            setSelectAll(false)
            fetchData()
        } catch (error) {
            toast.error('Erro ao marcar notificações')
        }
    }

    // Excluir em lote
    const handleBulkDelete = async () => {
        try {
            const promises = selectedIds.map(id =>
                fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' })
            )
            await Promise.all(promises)
            toast.success(`${selectedIds.length} notificação(ões) excluída(s)`)
            setSelectedIds([])
            setSelectAll(false)
            fetchData()
        } catch (error) {
            toast.error('Erro ao excluir notificações')
        }
    }

    // Marcar todas como lidas
    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch('/api/admin/notifications/mark-all-read', {
                method: 'PATCH'
            })
            if (response.ok) {
                toast.success('Todas as notificações marcadas como lidas')
                fetchData()
            }
        } catch (error) {
            toast.error('Erro ao marcar notificações')
        }
    }

    // Limpar todas as lidas
    const handleClearRead = async () => {
        if (!confirm('Tem certeza que deseja excluir todas as notificações lidas?')) return

        try {
            const response = await fetch('/api/admin/notifications', { method: 'DELETE' })
            if (response.ok) {
                const data = await response.json()
                toast.success(data.message)
                fetchData()
            }
        } catch (error) {
            toast.error('Erro ao limpar notificações')
        }
    }

    // Obter config do tipo
    const getTypeConfig = (type: string) =>
        NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[8]

    // Formatar data
    const formatDate = (date: string) => {
        try {
            return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
        } catch { return '-' }
    }

    const formatRelative = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
        } catch { return '' }
    }

    // Ações em lote
    const bulkActions: BulkAction[] = [
        {
            id: 'markRead',
            label: 'Marcar como Lidas',
            icon: <CheckCheck className="h-4 w-4" />,
            variant: 'success',
            onClick: handleMarkAsRead
        },
        {
            id: 'delete',
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            requiresConfirmation: true,
            onClick: handleBulkDelete
        }
    ]

    const activeFiltersCount = [
        typeFilter !== 'all',
        statusFilter !== 'all',
        search !== ''
    ].filter(Boolean).length

    const unreadCount = notifications.filter(n => !n.isRead).length

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="h-6 w-6" />
                        Notificações do Sistema
                    </h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas as notificações lidas'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Marcar Todas
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleClearRead}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Lidas
                    </Button>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar
                selectedIds={selectedIds}
                actions={bulkActions}
                itemType="notificação"
                onClearSelection={() => { setSelectedIds([]); setSelectAll(false) }}
            />

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
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

                        {/* Filtro de Tipo */}
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                {NOTIFICATION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Filtro de Status */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="unread">Não lidas</SelectItem>
                                <SelectItem value="read">Lidas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Resumo */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            {activeFiltersCount > 0 && (
                                <>
                                    <Badge variant="secondary">
                                        <Filter className="h-3 w-3 mr-1" />
                                        {activeFiltersCount} filtro(s)
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSearch('')
                                            setTypeFilter('all')
                                            setStatusFilter('all')
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {filteredNotifications.length} de {notifications.length} notificação(ões)
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela Desktop */}
            <div className="hidden md:block">
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectAll && filteredNotifications.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Notificação</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Prioridade</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredNotifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredNotifications.map((notification) => {
                                    const typeConfig = getTypeConfig(notification.type)
                                    const TypeIcon = typeConfig.icon

                                    return (
                                        <TableRow
                                            key={notification.id}
                                            className={`${selectedIds.includes(notification.id) ? 'bg-blue-50' : ''} ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(notification.id)}
                                                    onCheckedChange={() => toggleSelect(notification.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                                                        <TypeIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                                                {notification.title}
                                                            </p>
                                                            {!notification.isRead && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={typeConfig.color}>
                                                    {typeConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={PRIORITY_STYLES[notification.priority]}>
                                                    {notification.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p>{formatRelative(notification.createdAt)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(notification.createdAt)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {notification.actionUrl && (
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={notification.actionUrl}>
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Cards Mobile */}
            <div className="md:hidden space-y-4">
                {/* Card de Seleção */}
                <Card
                    className={`cursor-pointer transition-colors ${selectAll ? 'bg-blue-50 border-blue-200' : ''}`}
                    onClick={toggleSelectAll}
                >
                    <CardContent className="py-3">
                        <div className="flex items-center gap-3">
                            <Checkbox checked={selectAll && filteredNotifications.length > 0} onCheckedChange={toggleSelectAll} />
                            <span className="text-sm font-medium">{selectAll ? 'Desmarcar todas' : 'Selecionar todas'}</span>
                            {selectedIds.length > 0 && (
                                <Badge variant="secondary" className="ml-auto">{selectedIds.length} selecionada(s)</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {filteredNotifications.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredNotifications.map((notification) => {
                        const typeConfig = getTypeConfig(notification.type)
                        const TypeIcon = typeConfig.icon

                        return (
                            <Card
                                key={notification.id}
                                className={`cursor-pointer transition-colors ${selectedIds.includes(notification.id) ? 'bg-blue-50 border-blue-200' : ''
                                    } ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                                onClick={() => toggleSelect(notification.id)}
                            >
                                <CardContent className="py-4">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={selectedIds.includes(notification.id)}
                                            onCheckedChange={() => toggleSelect(notification.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />

                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                                            <TypeIcon className="h-5 w-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={`truncate ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                                                    {notification.title}
                                                </h3>
                                                <Badge className={PRIORITY_STYLES[notification.priority]}>
                                                    {notification.priority}
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <Badge variant="outline" className={typeConfig.color}>
                                                    {typeConfig.label}
                                                </Badge>
                                                <span>{formatRelative(notification.createdAt)}</span>
                                            </div>
                                        </div>

                                        {notification.actionUrl && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Link href={notification.actionUrl}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
