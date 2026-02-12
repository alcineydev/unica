'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Save,
    Loader2,
    ImageIcon,
    Trash2,
    Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default function NovaCategoriaPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: 'Store',
        description: '',
        banner: '',
    })

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }

    const handleNameChange = (name: string) => {
        setFormData((prev) => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }))
    }

    // Upload de imagem
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Selecione uma imagem válida')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Imagem deve ter no máximo 5MB')
            return
        }

        setUploading(true)
        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            formDataUpload.append('folder', 'categories')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            })

            if (!response.ok) {
                throw new Error('Erro ao fazer upload')
            }

            const data = await response.json()
            setFormData((prev) => ({ ...prev, banner: data.url }))
            toast.success('Imagem enviada!')
        } catch (error) {
            console.error('Erro no upload:', error)
            toast.error('Erro ao enviar imagem')
        } finally {
            setUploading(false)
        }
    }

    const removeBanner = () => {
        setFormData((prev) => ({ ...prev, banner: '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validações
        if (!formData.name.trim()) {
            toast.error('Nome é obrigatório')
            return
        }

        if (!formData.banner.trim()) {
            toast.error('Banner é obrigatório')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    slug: formData.slug.trim() || generateSlug(formData.name),
                    icon: formData.icon || 'Store',
                    description: formData.description.trim() || null,
                    banner: formData.banner.trim(),
                    isActive: true,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar categoria')
            }

            toast.success('Categoria criada com sucesso!')
            router.push('/admin/categorias')
        } catch (error) {
            console.error('Erro ao criar categoria:', error)
            toast.error(error instanceof Error ? error.message : 'Erro ao criar categoria')
        } finally {
            setLoading(false)
        }
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
                        <h1 className="text-2xl font-bold">Nova Categoria</h1>
                        <p className="text-muted-foreground">
                            Crie uma nova categoria para organizar os parceiros
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Informações Básicas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Informações Básicas
                            </CardTitle>
                            <CardDescription>
                                Dados principais da categoria
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Nome */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Ex: Restaurantes"
                                    disabled={loading}
                                />
                            </div>

                            {/* Slug */}
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                                    placeholder="restaurantes"
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    URL amigável (gerado automaticamente)
                                </p>
                            </div>

                            {/* Ícone */}
                            <div className="space-y-2">
                                <Label htmlFor="icon">Ícone</Label>
                                <Input
                                    id="icon"
                                    value={formData.icon}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                                    placeholder="Store"
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Nome do ícone Lucide (Store, Utensils, ShoppingBag, etc.)
                                </p>
                            </div>

                            {/* Descrição */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Descrição da categoria..."
                                    rows={3}
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Banner */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Banner
                            </CardTitle>
                            <CardDescription>
                                Imagem de capa da categoria (obrigatório)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>
                                    Banner <span className="text-red-500">*</span>
                                </Label>

                                {formData.banner ? (
                                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border">
                                        <Image
                                            src={formData.banner}
                                            alt="Banner"
                                            fill
                                            className="object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute right-2 top-2"
                                            onClick={removeBanner}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleUpload}
                                            disabled={loading || uploading}
                                        />
                                        {uploading ? (
                                            <>
                                                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                                                <span className="mt-2 text-sm text-muted-foreground">Enviando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                                <span className="mt-2 text-sm text-muted-foreground">
                                                    Clique para enviar imagem
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Recomendado: 1920x1080 (16:9)
                                                </span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>

                            {/* Preview */}
                            {formData.name && (
                                <div className="mt-6 rounded-lg border p-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Preview</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <Tag className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{formData.name}</p>
                                            <p className="text-sm text-muted-foreground">/{formData.slug || 'slug'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" asChild disabled={loading}>
                        <Link href="/admin/categorias">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={loading || uploading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Criar Categoria
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
