'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Save, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'

interface Category {
    id: string
    name: string
    slug: string
    description?: string
    icon: string
    banner: string
    isActive: boolean
    _count?: {
        parceiros: number
    }
}

export default function EditarCategoriaPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        banner: '',
        isActive: true,
    })

    // Carregar categoria
    const fetchCategory = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/categories/${id}`)

            if (response.ok) {
                const result = await response.json()
                const data = result.data || result
                setCategory(data)
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    banner: data.banner || '',
                    isActive: data.isActive ?? true,
                })
            } else {
                toast.error('Categoria não encontrada')
                router.push('/admin/categorias')
            }
        } catch (error) {
            console.error('Erro ao carregar categoria:', error)
            toast.error('Erro ao carregar categoria')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (id) fetchCategory()
    }, [id, fetchCategory])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Nome é obrigatório')
            return
        }

        if (!formData.banner) {
            toast.error('Banner é obrigatório')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            toast.success('Categoria atualizada com sucesso!')
            router.push('/admin/categorias')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!category) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Categoria não encontrada</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/categorias">Voltar</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/categorias">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Editar Categoria</h1>
                        <p className="text-muted-foreground">Atualize os dados da categoria</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações da Categoria</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Nome da categoria"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Descrição da categoria"
                                        rows={3}
                                    />
                                </div>



                                <div className="space-y-2">
                                    <Label>Banner *</Label>
                                    <ImageUpload
                                        value={formData.banner}
                                        onChange={(url) => setFormData(prev => ({ ...prev, banner: url || '' }))}
                                        folder="categories"
                                        aspectRatio="banner"
                                        placeholder="Clique para fazer upload do banner"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Proporção recomendada: 4:1 (ex: 1200x300 pixels)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna Lateral */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Categoria Ativa</p>
                                        <p className="text-sm text-muted-foreground">
                                            Categorias inativas não aparecem no app
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData(prev => ({ ...prev, isActive: checked }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {/* Banner Preview */}
                                    {formData.banner && (
                                        <div className="relative aspect-[4/1] bg-muted rounded-lg overflow-hidden">
                                            <Image
                                                src={formData.banner}
                                                alt={formData.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    )}

                                    {/* Card Preview */}
                                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                                        {formData.banner ? (
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={formData.banner}
                                                    alt={formData.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <FolderOpen className="h-6 w-6 text-purple-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{formData.name || 'Nome da categoria'}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {formData.description || 'Descrição'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info */}
                        {category._count && category._count.parceiros > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Esta categoria possui <strong>{category._count.parceiros}</strong> parceiro(s) vinculado(s)
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Botão Salvar */}
                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
