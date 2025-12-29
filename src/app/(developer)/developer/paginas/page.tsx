'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Pencil, Eye, EyeOff, Loader2, ExternalLink, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Page {
  id: string
  title: string
  slug: string
  content: string | null
  metaTitle: string | null
  metaDescription: string | null
  isPublished: boolean
  showInFooter: boolean
  footerOrder: number
  createdAt: string
  updatedAt: string
}

const defaultFormData = {
  title: '',
  slug: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
  isPublished: false,
  showInFooter: false,
  footerOrder: 0
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')

  const [formData, setFormData] = useState(defaultFormData)

  useEffect(() => {
    loadPages()
  }, [])

  async function loadPages() {
    try {
      const response = await fetch('/api/developer/pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages)
      }
    } catch (error) {
      console.error('Erro ao carregar páginas:', error)
      toast.error('Erro ao carregar páginas')
    } finally {
      setLoading(false)
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function openCreateDialog() {
    setFormData(defaultFormData)
    setSelectedPage(null)
    setIsEditing(false)
    setActiveTab('editor')
    setDialogOpen(true)
  }

  function openEditDialog(page: Page) {
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      isPublished: page.isPublished,
      showInFooter: page.showInFooter,
      footerOrder: page.footerOrder
    })
    setSelectedPage(page)
    setIsEditing(true)
    setActiveTab('editor')
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = isEditing
        ? `/api/developer/pages/${selectedPage?.id}`
        : '/api/developer/pages'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(isEditing ? 'Página atualizada!' : 'Página criada!')
        setDialogOpen(false)
        loadPages()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar página')
      }
    } catch (error) {
      console.error('Erro ao salvar página:', error)
      toast.error('Erro ao salvar página')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(page: Page) {
    try {
      const response = await fetch(`/api/developer/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !page.isPublished }),
      })

      if (response.ok) {
        toast.success(
          page.isPublished
            ? 'Página despublicada'
            : 'Página publicada'
        )
        loadPages()
      } else {
        toast.error('Erro ao alterar status')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status')
    }
  }

  async function handleDelete() {
    if (!selectedPage) return

    try {
      const response = await fetch(`/api/developer/pages/${selectedPage.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Página removida com sucesso!')
        setDeleteDialogOpen(false)
        setSelectedPage(null)
        loadPages()
      } else {
        toast.error('Erro ao remover página')
      }
    } catch (error) {
      console.error('Erro ao deletar página:', error)
      toast.error('Erro ao remover página')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Páginas Institucionais</h1>
          <p className="text-zinc-400 mt-1">
            Gerencie páginas como Sobre, Termos de Uso, Política de Privacidade
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Página
        </Button>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Páginas Cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma página cadastrada</p>
              <Button
                onClick={openCreateDialog}
                variant="link"
                className="text-red-400 mt-2"
              >
                Criar primeira página
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700">
                  <TableHead className="text-zinc-400">Título</TableHead>
                  <TableHead className="text-zinc-400">Slug</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Footer</TableHead>
                  <TableHead className="text-zinc-400">Atualizado</TableHead>
                  <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id} className="border-zinc-700">
                    <TableCell className="text-white font-medium">
                      {page.title}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      <code className="bg-zinc-900 px-2 py-1 rounded text-sm">
                        /p/{page.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={page.isPublished ? 'default' : 'secondary'}
                        className={
                          page.isPublished
                            ? 'bg-green-600'
                            : 'bg-zinc-600'
                        }
                      >
                        {page.isPublished ? 'Publicada' : 'Rascunho'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {page.showInFooter ? (
                        <Badge className="bg-blue-600">
                          Ordem: {page.footerOrder}
                        </Badge>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {new Date(page.updatedAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {page.isPublished && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/p/${page.slug}`, '_blank')}
                            className="text-zinc-400 hover:text-white"
                            title="Ver página"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePublish(page)}
                          className="text-zinc-400 hover:text-white"
                          title={page.isPublished ? 'Despublicar' : 'Publicar'}
                        >
                          {page.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(page)}
                          className="text-zinc-400 hover:text-white"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPage(page)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-400 hover:text-red-300"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isEditing ? 'Editar Página' : 'Nova Página'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-zinc-800 border-zinc-700">
                <TabsTrigger value="editor" className="data-[state=active]:bg-zinc-700">
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-zinc-700">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="seo" className="data-[state=active]:bg-zinc-700">
                  SEO
                </TabsTrigger>
                <TabsTrigger value="config" className="data-[state=active]:bg-zinc-700">
                  Configurações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Título</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value
                        setFormData({
                          ...formData,
                          title,
                          slug: !isEditing ? generateSlug(title) : formData.slug
                        })
                      }}
                      placeholder="Ex: Sobre Nós"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Slug (URL)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">/p/</span>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="sobre-nos"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Conteúdo (HTML)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="<h2>Título</h2><p>Conteúdo da página...</p>"
                    className="bg-zinc-800 border-zinc-700 text-white font-mono min-h-[300px]"
                  />
                  <p className="text-xs text-zinc-500">
                    Use HTML para formatar o conteúdo. Tags permitidas: h1-h6, p, strong, em, ul, ol, li, a, br
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="bg-white rounded-lg p-6 min-h-[400px]">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{formData.title || 'Título da Página'}</h1>
                  <div
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-gray-500">Nenhum conteúdo...</p>' }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Meta Título</Label>
                  <Input
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="Título para SEO (deixe vazio para usar o título)"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Meta Descrição</Label>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="Descrição curta para mecanismos de busca (máx. 160 caracteres)"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    maxLength={160}
                  />
                  <p className="text-xs text-zinc-500">
                    {formData.metaDescription.length}/160 caracteres
                  </p>
                </div>

                {/* SEO Preview */}
                <div className="bg-zinc-800 rounded-lg p-4 space-y-1">
                  <p className="text-sm text-zinc-500">Preview no Google:</p>
                  <p className="text-blue-400 text-lg">
                    {formData.metaTitle || formData.title || 'Título da Página'} | UNICA
                  </p>
                  <p className="text-green-500 text-sm">
                    www.exemplo.com/p/{formData.slug || 'slug'}
                  </p>
                  <p className="text-zinc-400 text-sm line-clamp-2">
                    {formData.metaDescription || 'Descrição da página aparecerá aqui...'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300">Publicar Página</Label>
                    <p className="text-xs text-zinc-500">Torna a página visível publicamente</p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300">Exibir no Rodapé</Label>
                    <p className="text-xs text-zinc-500">Mostra o link da página no rodapé do site</p>
                  </div>
                  <Switch
                    checked={formData.showInFooter}
                    onCheckedChange={(checked) => setFormData({ ...formData, showInFooter: checked })}
                  />
                </div>

                {formData.showInFooter && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Ordem no Rodapé</Label>
                    <Input
                      type="number"
                      value={formData.footerOrder}
                      onChange={(e) => setFormData({ ...formData, footerOrder: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={100}
                      className="bg-zinc-800 border-zinc-700 text-white w-24"
                    />
                    <p className="text-xs text-zinc-500">Menor número = aparece primeiro</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-zinc-700 text-zinc-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Página'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Excluir Página
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir a página{' '}
              <strong className="text-white">{selectedPage?.title}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
