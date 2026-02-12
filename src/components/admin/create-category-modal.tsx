'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ImageIcon, Trash2 } from 'lucide-react'
import Image from 'next/image'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateCategoryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (category: { id: string; name: string; slug: string }) => void
}

export function CreateCategoryModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateCategoryModalProps) {
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

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast.error('Selecione uma imagem válida')
            return
        }

        // Validar tamanho (máx 5MB)
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

    const handleSubmit = async () => {
        // Validação apenas do nome (obrigatório)
        if (!formData.name.trim()) {
            toast.error('Nome é obrigatório')
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
                    banner: formData.banner.trim() || null, // ✅ Opcional agora
                    isActive: true,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar categoria')
            }

            toast.success('Categoria criada com sucesso!')
            onSuccess(data.data || data)
            onOpenChange(false)

            // Reset form
            setFormData({
                name: '',
                slug: '',
                icon: 'Store',
                description: '',
                banner: '',
            })
        } catch (error) {
            console.error('Erro ao criar categoria:', error)
            toast.error(error instanceof Error ? error.message : 'Erro ao criar categoria')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            onOpenChange(false)
            setFormData({
                name: '',
                slug: '',
                icon: 'Store',
                description: '',
                banner: '',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                    <DialogDescription>
                        Crie uma categoria rapidamente. Você pode adicionar o banner depois na edição.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
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
                            className="text-sm"
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
                            className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Nome do ícone Lucide (Store, Utensils, ShoppingBag)
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
                            rows={2}
                            disabled={loading}
                            className="text-sm resize-none"
                        />
                    </div>

                    {/* Banner (Opcional) */}
                    <div className="space-y-2">
                        <Label>
                            Banner <span className="text-muted-foreground text-xs">(opcional)</span>
                        </Label>

                        {formData.banner ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
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
                                    className="absolute right-2 top-2 h-7 w-7"
                                    onClick={removeBanner}
                                    disabled={loading}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors bg-muted/30">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUpload}
                                    disabled={loading || uploading}
                                />
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="mt-1 text-xs text-muted-foreground">Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        <span className="mt-1 text-xs text-muted-foreground">
                                            Clique para adicionar (opcional)
                                        </span>
                                    </>
                                )}
                            </label>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={loading} size="sm">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || uploading} size="sm">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            'Criar Categoria'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
