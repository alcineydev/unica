'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { FileText, Shield, Scale, Loader2, Save, ArrowLeft, Eye, ExternalLink, Clock } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { PageHeader } from '@/components/admin/page-header'

const PAGE_ICONS: Record<string, React.ReactNode> = {
    'termos-e-condicoes': <Scale className="h-5 w-5" />,
    'politica-de-privacidade': <Shield className="h-5 w-5" />,
    'aviso-legal': <FileText className="h-5 w-5" />,
}

const PAGE_DESCRIPTIONS: Record<string, string> = {
    'termos-e-condicoes': 'Obrigatório no checkout. O assinante precisa aceitar antes de pagar.',
    'politica-de-privacidade': 'Exigido pela LGPD. Detalha como os dados pessoais são tratados.',
    'aviso-legal': 'Disclaimers, limitações de responsabilidade e informações jurídicas.',
}

const PAGE_URLS: Record<string, string> = {
    'termos-e-condicoes': '/termos',
    'politica-de-privacidade': '/privacidade',
    'aviso-legal': '/aviso-legal',
}

interface LegalPageSummary {
    id: string
    slug: string
    title: string
    isActive: boolean
    version: number
    updatedAt: string
}

interface LegalPageFull extends LegalPageSummary {
    content: string
}

export default function PaginasLegaisPage() {
    const [pages, setPages] = useState<LegalPageSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPage, setSelectedPage] = useState<LegalPageFull | null>(null)
    const [editContent, setEditContent] = useState('')
    const [editTitle, setEditTitle] = useState('')
    const [editActive, setEditActive] = useState(true)
    const [loadingPage, setLoadingPage] = useState(false)
    const [saving, setSaving] = useState(false)

    const fetchPages = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/legal-pages')
            if (response.ok) {
                const data = await response.json()
                setPages(data)
            }
        } catch (error) {
            console.error('Erro:', error)
            toast.error('Erro ao carregar páginas')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPages()
    }, [fetchPages])

    const loadPage = async (slug: string) => {
        try {
            setLoadingPage(true)
            const response = await fetch(`/api/admin/legal-pages/${slug}`)
            if (response.ok) {
                const data = await response.json()
                setSelectedPage(data)
                setEditContent(data.content)
                setEditTitle(data.title)
                setEditActive(data.isActive)
            }
        } catch (error) {
            toast.error('Erro ao carregar página')
        } finally {
            setLoadingPage(false)
        }
    }

    const handleSave = async () => {
        if (!selectedPage) return

        try {
            setSaving(true)
            const response = await fetch(`/api/admin/legal-pages/${selectedPage.slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle,
                    content: editContent,
                    isActive: editActive,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || 'Erro ao salvar')
                return
            }

            toast.success(data.message)
            if (data.page) setSelectedPage(data.page)
            fetchPages()
        } catch (error) {
            toast.error('Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const handleBack = () => {
        setSelectedPage(null)
        setEditContent('')
        setEditTitle('')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    // VIEW: Editor
    if (selectedPage) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{editTitle}</h1>
                            <p className="text-muted-foreground">
                                Versão {selectedPage.version} • {new Date(selectedPage.updatedAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => window.open(PAGE_URLS[selectedPage.slug], '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Título</Label>
                                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <Switch checked={editActive} onCheckedChange={setEditActive} />
                                <Label>Ativa</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                        Ao alterar o conteúdo, a versão será incrementada. Assinantes precisarão aceitar novamente.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Conteúdo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingPage ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : (
                            <RichTextEditor content={editContent} onChange={setEditContent} />
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // VIEW: Lista
    return (
        <div className="space-y-6">
            <PageHeader title="Páginas Legais" description="Gerencie os textos legais obrigatórios" />

            <div className="grid gap-4">
                {pages.map((page) => (
                    <Card key={page.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => loadPage(page.slug)}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        {PAGE_ICONS[page.slug] || <FileText className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{page.title}</h3>
                                        <p className="text-sm text-muted-foreground">{PAGE_DESCRIPTIONS[page.slug]}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right text-sm text-muted-foreground hidden md:block">
                                        <p>Versão {page.version}</p>
                                        <p>{new Date(page.updatedAt).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <Badge variant={page.isActive ? 'default' : 'secondary'}>
                                        {page.isActive ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(PAGE_URLS[page.slug], '_blank')
                                        }}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {pages.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Nenhuma página encontrada</h3>
                            <p className="text-muted-foreground">Execute o seed para criar as páginas padrão.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
