'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    User,
    Building2,
    CreditCard,
    AlertTriangle,
    Clock,
    XCircle,
    ArrowRight,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

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

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
    NEW_SUBSCRIBER: <User className="h-4 w-4 text-green-600" />,
    NEW_PARTNER: <Building2 className="h-4 w-4 text-blue-600" />,
    TRANSACTION: <CreditCard className="h-4 w-4 text-purple-600" />,
    EXPIRING_SOON: <Clock className="h-4 w-4 text-yellow-600" />,
    EXPIRING_TODAY: <AlertTriangle className="h-4 w-4 text-orange-600" />,
    EXPIRED: <XCircle className="h-4 w-4 text-red-600" />,
    PAYMENT_RECEIVED: <CreditCard className="h-4 w-4 text-green-600" />,
    PAYMENT_FAILED: <XCircle className="h-4 w-4 text-red-600" />,
    SYSTEM: <Bell className="h-4 w-4 text-gray-600" />,
}

const PRIORITY_STYLES: Record<string, string> = {
    LOW: '',
    NORMAL: '',
    HIGH: 'border-l-4 border-l-orange-400',
    URGENT: 'border-l-4 border-l-red-500 bg-red-50',
}

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    // Buscar contador de não lidas
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/notifications/unread-count')
            if (response.ok) {
                const data = await response.json()
                setUnreadCount(data.count || 0)
            }
        } catch (error) {
            console.error('Erro ao buscar contador:', error)
        }
    }, [])

    // Buscar notificações
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/notifications?limit=10')
            if (response.ok) {
                const data = await response.json()
                setNotifications(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Erro ao buscar notificações:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Polling para atualizar contador (a cada 30s)
    useEffect(() => {
        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 30000)
        return () => clearInterval(interval)
    }, [fetchUnreadCount])

    // Buscar notificações quando abrir dropdown
    useEffect(() => {
        if (open) {
            fetchNotifications()
        }
    }, [open, fetchNotifications])

    // Marcar como lida
    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead: true })
            })

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Erro ao marcar como lida:', error)
        }
    }

    // Marcar todas como lidas
    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch('/api/admin/notifications/mark-all-read', {
                method: 'PATCH'
            })

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                setUnreadCount(0)
                toast.success('Todas as notificações marcadas como lidas')
            }
        } catch (error) {
            toast.error('Erro ao marcar notificações')
        }
    }

    // Excluir notificação
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const response = await fetch(`/api/admin/notifications/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                const notification = notifications.find(n => n.id === id)
                if (notification && !notification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
                setNotifications(prev => prev.filter(n => n.id !== id))
                toast.success('Notificação excluída')
            }
        } catch (error) {
            toast.error('Erro ao excluir')
        }
    }

    // Formatar data relativa
    const formatDate = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
        } catch {
            return ''
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="font-semibold">Notificações</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => fetchNotifications()}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={handleMarkAllAsRead}
                            >
                                <CheckCheck className="h-4 w-4 mr-1" />
                                Marcar todas
                            </Button>
                        )}
                    </div>
                </div>

                {/* Lista */}
                <ScrollArea className="max-h-[400px]">
                    {loading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`group relative ${!notification.isRead ? 'bg-blue-50/50' : ''} ${PRIORITY_STYLES[notification.priority] || ''}`}
                                >
                                    {notification.actionUrl ? (
                                        <Link
                                            href={notification.actionUrl}
                                            onClick={() => {
                                                if (!notification.isRead) {
                                                    handleMarkAsRead(notification.id)
                                                }
                                                setOpen(false)
                                            }}
                                            className="block p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <NotificationItem notification={notification} formatDate={formatDate} />
                                        </Link>
                                    ) : (
                                        <div className="p-4">
                                            <NotificationItem notification={notification} formatDate={formatDate} />
                                        </div>
                                    )}

                                    {/* Ações no hover */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        {!notification.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleMarkAsRead(notification.id)
                                                }}
                                                title="Marcar como lida"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-500 hover:text-red-700"
                                            onClick={(e) => handleDelete(notification.id, e)}
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="p-3 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-center text-sm"
                        asChild
                        onClick={() => setOpen(false)}
                    >
                        <Link href="/admin/notificacoes">
                            Ver todas as notificações
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

// Componente interno para renderizar item
function NotificationItem({
    notification,
    formatDate
}: {
    notification: AdminNotification
    formatDate: (date: string) => string
}) {
    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {NOTIFICATION_ICONS[notification.type] || <Bell className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {notification.title}
                    </p>
                    {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(notification.createdAt)}
                </p>
            </div>
        </div>
    )
}
