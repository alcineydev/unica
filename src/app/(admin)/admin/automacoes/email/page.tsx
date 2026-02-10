'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
    Plus,
    MoreHorizontal,
    Eye,
    Trash2,
    Loader2,
    Mail,
    Search,
    X,
    Filter,
    Send,
    Copy,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Users,
    User,
    Building2,
    FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { BulkActionsToolbar, type BulkAction } from '@/components/admin/bulk-actions/bulk-actions-toolbar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface EmailCampaign {
    id: string
    subject: string
    htmlContent: string
    targetType: string
    status: string
    sentCount: number
    failedCount: number
    sentAt?: string
    createdAt: string
    targetPlan?: { id: string; name: string }
    targetCity?: { id: string; name: string }
    sentByUser?: { id: string; email: string }
    individualEmail?: string
}

const CAMPAIGN_STATUSES = [
    { value: 'DRAFT', label: 'Rascunho', icon: FileText, color: 'bg-gray-100 text-gray-800' },
    { value: 'SENDING', label: 'Enviando', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'SENT', label: 'Enviada', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'PARTIAL', label: 'Parcial', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
    { value: 'FAILED', label: 'Falhou', icon: XCircle, color: 'bg-red-100 text-red-800' },
]

const TARGET_TYPES = [
    { value: 'INDIVIDUAL', label: 'Individual', icon: User },
    { value: 'ALL_ASSINANTES', label: 'Todos Assinantes', icon: Users },
    { value: 'PLANO_ESPECIFICO', label: 'Plano Específico', icon: Users },
    { value: 'CIDADE_ESPECIFICA', label: 'Cidade Específica', icon: Users },
    { value: 'ALL_PARCEIROS', label: 'Todos Parceiros', icon: Building2 },
    { value: 'TODOS', label: 'Todos', icon: Users },
]

export default function EmailCampaignsPage() {
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [targetFilter, setTargetFilter] = useState('all')

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectAll, setSelectAll] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/email')
            if (response.ok) {
                const data = await response.json()
                setCampaigns(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Erro ao carregar campanhas:', error)
            toast.error('Erro ao carregar campanhas')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesSearch = search === '' ||
            campaign.subject?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
        const matchesTarget = targetFilter === 'all' || campaign.targetType === targetFilter
        return matchesSearch && matchesStatus && matchesTarget
    })

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredCampaigns.map(c => c.id))
        }
        setSelectAll(!selectAll)
    }

    useEffect(() => {
        setSelectedIds([])
        setSelectAll(false)
    }, [search, statusFilter, targetFilter])

    const handleBulkAction = async (action: string) => {
        try {
            const response = await fetch('/api/admin/email/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ids: selectedIds })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Erro na operação')
            toast.success(data.message)
            setSelectedIds([])
            setSelectAll(false)
            fetchData()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro na operação')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return
        try {
            const response = await fetch(`/api/admin/email/${id}`, { method: 'DELETE' })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao excluir')
            }
            toast.success('Campanha excluída com sucesso')
            fetchData()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
        }
    }

    const handleSend = async (id: string) => {
        if (!confirm('Tem certeza que deseja enviar esta campanha agora?')) return
        try {
            const response = await fetch(`/api/admin/email/${id}/enviar`, { method: 'POST' })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Erro ao enviar')
            toast.success(data.message)
            fetchData()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar')
        }
    }

    const getStatusConfig = (status: string) =>
        CAMPAIGN_STATUSES.find(s => s.value === status) || CAMPAIGN_STATUSES[0]

    const getTargetConfig = (target: string) =>
        TARGET_TYPES.find(t => t.value === target) || TARGET_TYPES[0]

    const getTargetLabel = (campaign: EmailCampaign) => {
        switch (campaign.targetType) {
            case 'INDIVIDUAL': return campaign.individualEmail || 'Individual'
            case 'PLANO_ESPECIFICO': return campaign.targetPlan?.name || 'Plano'
            case 'CIDADE_ESPECIFICA': return campaign.targetCity?.name || 'Cidade'
            default: return getTargetConfig(campaign.targetType).label
        }
    }

    const formatDate = (date?: string) => {
        if (!date) return '-'
        try {
            return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
        } catch { return '-' }
    }

    const bulkActions: BulkAction[] = [
        {
            id: 'duplicate',
            label: 'Duplicar',
            icon: <Copy className="h-4 w-4" />,
            variant: 'default',
            onClick: async () => { await handleBulkAction('duplicate') }
        },
        {
            id: 'delete',
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            requiresConfirmation: true,
            onClick: async () => { await handleBulkAction('delete') }
        }
    ]

    const activeFiltersCount = [
        statusFilter !== 'all',
        targetFilter !== 'all',
        search !== ''
    ].filter(Boolean).length

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Campanhas de Email</h1>
                    <p className="text-muted-foreground">Gerencie suas campanhas de email marketing</p>
                </div>
                <Button asChild>
                    <Link href="/admin/automacoes/email/nova">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Campanha
                    </Link>
                </Button>
            </div>

            {/* Bulk Actions */}
            <BulkActionsToolbar
                selectedIds={selectedIds}
                actions={bulkActions}
                itemType="campanha"
                onClearSelection={() => { setSelectedIds([]); setSelectAll(false) }}
            />

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por assunto..."
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

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                {CAMPAIGN_STATUSES.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

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
                                            setStatusFilter('all')
                                            setTargetFilter('all')
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {filteredCampaigns.length} campanha(s)
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
                                        checked={selectAll && filteredCampaigns.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Campanha</TableHead>
                                <TableHead>Destinatário</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Enviados</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCampaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCampaigns.map((campaign) => {
                                    const statusConfig = getStatusConfig(campaign.status)
                                    const StatusIcon = statusConfig.icon

                                    return (
                                        <TableRow
                                            key={campaign.id}
                                            className={cn(selectedIds.includes(campaign.id) && 'bg-blue-50')}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(campaign.id)}
                                                    onCheckedChange={() => toggleSelect(campaign.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                        <Mail className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{campaign.subject}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            por {campaign.sentByUser?.email || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{getTargetLabel(campaign)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusConfig.color}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {statusConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-sm">
                                                    <span className="text-green-600">{campaign.sentCount || 0}</span>
                                                    {campaign.failedCount > 0 && (
                                                        <>
                                                            <span>/</span>
                                                            <span className="text-red-600">{campaign.failedCount}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {campaign.sentAt ? formatDate(campaign.sentAt) : formatDate(campaign.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {campaign.status === 'DRAFT' && (
                                                            <DropdownMenuItem onClick={() => handleSend(campaign.id)}>
                                                                <Send className="h-4 w-4 mr-2" />
                                                                Enviar Agora
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(campaign.id)}
                                                            className="text-red-600"
                                                            disabled={campaign.status === 'SENDING'}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                {filteredCampaigns.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredCampaigns.map((campaign) => {
                        const statusConfig = getStatusConfig(campaign.status)
                        const StatusIcon = statusConfig.icon

                        return (
                            <Card
                                key={campaign.id}
                                className={cn(
                                    "cursor-pointer transition-all",
                                    selectedIds.includes(campaign.id) && "ring-2 ring-blue-500 bg-blue-50/50"
                                )}
                                onClick={() => toggleSelect(campaign.id)}
                            >
                                <CardContent className="py-4">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={selectedIds.includes(campaign.id)}
                                            onCheckedChange={() => toggleSelect(campaign.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />

                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Mail className="h-5 w-5 text-blue-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-medium truncate">{campaign.subject}</h3>
                                                <Badge className={statusConfig.color}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {statusConfig.label}
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-2">
                                                Para: {getTargetLabel(campaign)}
                                            </p>

                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                    {campaign.sentCount || 0}
                                                </span>
                                                {campaign.failedCount > 0 && (
                                                    <span className="flex items-center gap-1 text-red-600">
                                                        <XCircle className="h-4 w-4" />
                                                        {campaign.failedCount}
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground ml-auto">
                                                    {campaign.sentAt
                                                        ? format(new Date(campaign.sentAt), "dd/MM HH:mm", { locale: ptBR })
                                                        : format(new Date(campaign.createdAt), "dd/MM HH:mm", { locale: ptBR })
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {campaign.status === 'DRAFT' && (
                                                    <DropdownMenuItem onClick={() => handleSend(campaign.id)}>
                                                        <Send className="h-4 w-4 mr-2" />
                                                        Enviar
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id) }}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
