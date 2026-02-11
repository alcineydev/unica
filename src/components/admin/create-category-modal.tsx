'use client'

import { useState } from 'react'
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
import { Loader2, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

interface CreateCategoryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (category: { id: string; name: string; slug: string }) => void
}

export function CreateCategoryModal({
    open,
    onOpenChange,
    onSuccess
}: CreateCategoryModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: 'Store',
        description: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Auto-gerar slug quando nome muda
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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
                    slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
                    icon: formData.icon || 'Store',
                    description: formData.description.trim() || null,
                    isActive: true
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao criar categoria')
            }

            const newCategory = await response.json()
            toast.success('Categoria criada com sucesso!')

            // Reset form
            setFormData({ name: '', slug: '', icon: 'Store', description: '' })

            // Callback de sucesso
            onSuccess(newCategory)
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar categoria')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderPlus className="h-5 w-5" />
                        Nova Categoria
                    </DialogTitle>
                    <DialogDescription>
                        Crie uma nova categoria para organizar os parceiros.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: Restaurantes"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder="restaurantes"
                        />
                        <p className="text-xs text-muted-foreground">
                            Gerado automaticamente a partir do nome
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Ícone</Label>
                        <Input
                            id="icon"
                            name="icon"
                            value={formData.icon}
                            onChange={handleChange}
                            placeholder="Store"
                        />
                        <p className="text-xs text-muted-foreground">
                            Nome do ícone Lucide (ex: Store, Utensils, Heart)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Descrição da categoria..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Criar Categoria
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
