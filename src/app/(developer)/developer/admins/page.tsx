'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Trash2, Power, PowerOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Admin {
  id: string
  name: string
  phone: string
  permissions: Record<string, boolean>
  createdAt: string
  user: {
    id: string
    email: string
    isActive: boolean
    createdAt: string
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  })

  useEffect(() => {
    loadAdmins()
  }, [])

  async function loadAdmins() {
    try {
      const response = await fetch('/api/developer/admins')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      }
    } catch (error) {
      console.error('Erro ao carregar admins:', error)
      toast.error('Erro ao carregar administradores')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/developer/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Administrador criado com sucesso!')
        setDialogOpen(false)
        setFormData({ email: '', password: '', name: '', phone: '' })
        loadAdmins()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar administrador')
      }
    } catch (error) {
      console.error('Erro ao criar admin:', error)
      toast.error('Erro ao criar administrador')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleStatus(admin: Admin) {
    try {
      const response = await fetch(`/api/developer/admins/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !admin.user.isActive }),
      })

      if (response.ok) {
        toast.success(
          admin.user.isActive
            ? 'Administrador desativado'
            : 'Administrador ativado'
        )
        loadAdmins()
      } else {
        toast.error('Erro ao alterar status')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status')
    }
  }

  async function handleDeleteAdmin() {
    if (!selectedAdmin) return

    try {
      const response = await fetch(`/api/developer/admins/${selectedAdmin.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Administrador removido com sucesso!')
        setDeleteDialogOpen(false)
        setSelectedAdmin(null)
        loadAdmins()
      } else {
        toast.error('Erro ao remover administrador')
      }
    } catch (error) {
      console.error('Erro ao deletar admin:', error)
      toast.error('Erro ao remover administrador')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Administradores</h1>
          <p className="text-zinc-400 mt-1">
            Gerencie os administradores do sistema
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Administrador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Senha</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
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
                  disabled={creating}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Admin
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Administradores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              Nenhum administrador cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700">
                  <TableHead className="text-zinc-400">Nome</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400">Telefone</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Criado em</TableHead>
                  <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id} className="border-zinc-700">
                    <TableCell className="text-white font-medium">
                      {admin.name}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {admin.user.email}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {admin.phone}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={admin.user.isActive ? 'default' : 'secondary'}
                        className={
                          admin.user.isActive
                            ? 'bg-green-600'
                            : 'bg-zinc-600'
                        }
                      >
                        {admin.user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(admin)}
                          className="text-zinc-400 hover:text-white"
                          title={admin.user.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {admin.user.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAdmin(admin)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-400 hover:text-red-300"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Remover Administrador
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja remover o administrador{' '}
              <strong className="text-white">{selectedAdmin?.name}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

