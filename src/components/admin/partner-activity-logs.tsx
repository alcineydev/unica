'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    ScrollText,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Info,
    AlertTriangle,
    Loader2,
    User,
    CreditCard,
    LogIn,
    Settings,
    Image as ImageIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityLog {
    id: string
    type: string
    action: string
    description: string
    metadata?: Record<string, any>
    level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
    createdAt: string
    userId?: string
    userName?: string
}

interface PartnerActivityLogsProps {
    partnerId: string
}

const levelConfig = {
    INFO: { icon: Info, color: 'bg-blue-100 text-blue-700', label: 'Info' },
    SUCCESS: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Sucesso' },
    WARNING: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700', label: 'Aviso' },
    ERROR: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Erro' },
}

const typeIcons: Record<string, React.ReactNode> = {
    LOGIN: <LogIn className="h-4 w-4" />,
    TRANSACTION: <CreditCard className="h-4 w-4" />,
    PROFILE: <User className="h-4 w-4" />,
    SETTINGS: <Settings className="h-4 w-4" />,
    IMAGE: <ImageIcon className="h-4 w-4" />,
}

// Mock de logs para demonstração (depois conectar com API real)
const mockLogs: ActivityLog[] = [
    {
        id: '1',
        type: 'LOGIN',
        action: 'login_success',
        description: 'Login realizado com sucesso',
        level: 'SUCCESS',
        createdAt: new Date().toISOString(),
        userName: 'Parceiro'
    },
    {
        id: '2',
        type: 'TRANSACTION',
        action: 'transaction_completed',
        description: 'Transação #123 concluída - R$ 150,00',
        level: 'SUCCESS',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: '3',
        type: 'PROFILE',
        action: 'profile_updated',
        description: 'Dados do perfil atualizados',
        level: 'INFO',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        id: '4',
        type: 'IMAGE',
        action: 'image_upload_failed',
        description: 'Falha ao fazer upload da imagem: arquivo muito grande',
        level: 'ERROR',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: '5',
        type: 'SETTINGS',
        action: 'password_changed',
        description: 'Senha alterada com sucesso',
        level: 'WARNING',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
]

export function PartnerActivityLogs({ partnerId }: PartnerActivityLogsProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const fetchLogs = async () => {
        setLoading(true)
        try {
            // TODO: Conectar com API real
            // const response = await fetch(`/api/admin/partners/${partnerId}/logs`)
            // const data = await response.json()
            // setLogs(data)

            // Por enquanto, usar mock
            await new Promise(resolve => setTimeout(resolve, 500))
            setLogs(mockLogs)
        } catch (error) {
            console.error('Erro ao carregar logs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [partnerId])

    // Filtrar logs
    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.description.toLowerCase().includes(search.toLowerCase()) ||
            log.action.toLowerCase().includes(search.toLowerCase())

        const matchesLevel = levelFilter === 'all' || log.level === levelFilter
        const matchesType = typeFilter === 'all' || log.type === typeFilter

        return matchesSearch && matchesLevel && matchesType
    })

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5" />
                        Logs de Atividade
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar nos logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Nível" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="INFO">Info</SelectItem>
                            <SelectItem value="SUCCESS">Sucesso</SelectItem>
                            <SelectItem value="WARNING">Aviso</SelectItem>
                            <SelectItem value="ERROR">Erro</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="LOGIN">Login</SelectItem>
                            <SelectItem value="TRANSACTION">Transação</SelectItem>
                            <SelectItem value="PROFILE">Perfil</SelectItem>
                            <SelectItem value="SETTINGS">Config</SelectItem>
                            <SelectItem value="IMAGE">Imagem</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Lista de Logs */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum log encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {filteredLogs.map((log) => {
                            const config = levelConfig[log.level]
                            const Icon = config.icon

                            return (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    {/* Ícone do tipo */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        {typeIcons[log.type] || <Info className="h-4 w-4" />}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-sm">{log.description}</p>
                                            <Badge className={`text-xs ${config.color}`}>
                                                <Icon className="h-3 w-3 mr-1" />
                                                {config.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <span>{format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                                            {log.userName && (
                                                <>
                                                    <span>•</span>
                                                    <span>{log.userName}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Contador */}
                <div className="pt-3 border-t text-xs text-muted-foreground">
                    Mostrando {filteredLogs.length} de {logs.length} registro(s)
                </div>
            </CardContent>
        </Card>
    )
}
