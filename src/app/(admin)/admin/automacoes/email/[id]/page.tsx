'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Loader2,
    Send,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    FileText,
    Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EmailCampaign {
    id: string
    subject: string
    htmlContent: string
    textContent?: string
    targetType: string
    status: string
    sentCount: number
    failedCount: number
    sentAt?: string
    createdAt: string
    individualEmail?: string
    targetPlan?: { id: string; name: string }
    targetCity?: { id: string; name: string }
    sentByUser?: { id: string; email: string; name?: string }
}

const CAMPAIGN_STATUSES = [
    { value: 'DRAFT', label: 'Rascunho', icon: FileText, color: 'bg-gray-100 text-gray-800' },
    { value: 'SENDING', label: 'Enviando', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'SENT', label: 'Enviada', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'PARTIAL', label: 'Parcial', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
    { value: 'FAILED', label: 'Falhou', icon: XCircle, color: 'bg-red-100 text-red-800' },
]

export default function VisualizarCampanhaPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    const fetchCampaign = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/email/${id}`)

            if (response.ok) {
                const data = await response.json()
                setCampaign(data)
            } else {
                toast.error('Campanha não encontrada')
                router.push('/admin/automacoes/email')
            }
        } catch (error) {
            console.error('Erro ao carregar campanha:', error)
            toast.error('Erro ao carregar campanha')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (id) fetchCampaign()
    }, [id, fetchCampaign])

    const handleSend = async () => {
        if (!confirm('Tem certeza que deseja enviar esta campanha agora?')) return

        setSending(true)
        try {
            const response = await fetch(`/api/admin/email/${id}/enviar`, {
                method: 'POST'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao enviar')
            }

            toast.success(data.message)
            fetchCampaign()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar')
        } finally {
            setSending(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return

        try {
            const response = await fetch(`/api/admin/email/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao excluir')
            }

            toast.success('Campanha excluída com sucesso')
            router.push('/admin/automacoes/email')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
        }
    }

    const getStatusConfig = (status: string) =>
        CAMPAIGN_STATUSES.find(s => s.value === status) || CAMPAIGN_STATUSES[0]

    const getTargetLabel = () => {
        if (!campaign) return '-'
        switch (campaign.targetType) {
            case 'INDIVIDUAL': return campaign.individualEmail || 'Individual'
            case 'ALL_ASSINANTES': return 'Todos os Assinantes'
            case 'PLANO_ESPECIFICO': return campaign.targetPlan?.name || 'Plano Específico'
            case 'CIDADE_ESPECIFICA': return campaign.targetCity?.name || 'Cidade Específica'
            case 'ALL_PARCEIROS': return 'Todos os Parceiros'
            case 'TODOS': return 'Todos (Assinantes + Parceiros)'
            default: return campaign.targetType
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Campanha não encontrada</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/automacoes/email">Voltar</Link>
                </Button>
            </div>
        )
    }

    const statusConfig = getStatusConfig(campaign.status)
    const StatusIcon = statusConfig.icon

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/automacoes/email">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{campaign.subject}</h1>
                            <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Criada em {format(new Date(campaign.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {campaign.status === 'DRAFT' && (
                        <Button onClick={handleSend} disabled={sending}>
                            {sending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Enviar Agora
                        </Button>
                    )}
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={campaign.status === 'SENDING'}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview do Email */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Preview do Email
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                                <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <span className="text-sm text-muted-foreground ml-2">{campaign.subject}</span>
                                </div>
                                <iframe
                                    srcDoc={campaign.htmlContent}
                                    className="w-full h-[500px] bg-white"
                                    title="Preview do Email"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Informações */}
                <div className="space-y-6">
                    {/* Métricas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Métricas de Envio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
                                    <p className="text-sm text-muted-foreground">Enviados</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
                                    <p className="text-sm text-muted-foreground">Falhas</p>
                                </div>
                            </div>
                            {campaign.sentAt && (
                                <p className="text-sm text-muted-foreground text-center">
                                    Enviada em {format(new Date(campaign.sentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Detalhes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Detalhes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Destinatário:</span>
                                <span className="font-medium">{getTargetLabel()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Criado por:</span>
                                <span className="font-medium">
                                    {campaign.sentByUser?.name || campaign.sentByUser?.email || '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge className={statusConfig.color}>
                                    {statusConfig.label}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
