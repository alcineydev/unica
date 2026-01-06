'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Trash2, Power, PowerOff, Loader2, Pencil, Terminal, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [editMode, setEditMode] = useState(false)

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

  function openCreateDialog() {
    setEditMode(false)
    setSelectedAdmin(null)
    setFormData({ email: '', password: '', name: '', phone: '' })
    setDialogOpen(true)
  }

  function openEditDialog(admin: Admin) {
    setEditMode(true)
    setSelectedAdmin(admin)
    setFormData({
      email: admin.user.email,
      password: '',
      name: admin.name,
      phone: admin.phone,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (editMode && selectedAdmin) {
        // Update existing admin
        const response = await fetch(`/api/developer/admins/${selectedAdmin.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            ...(formData.password && { password: formData.password }),
          }),
        })

        if (response.ok) {
          toast.success('Administrador atualizado com sucesso!')
          setDialogOpen(false)
          loadAdmins()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Erro ao atualizar administrador')
        }
      } else {
        // Create new admin
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
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error(editMode ? 'Erro ao atualizar administrador' : 'Erro ao criar administrador')
    } finally {
      setSaving(false)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">admins[]</h1>
              <p className="text-slate-500 text-sm font-mono">// gerenciar administradores do sistema</p>
            </div>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-mono font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              new_admin()
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white font-mono flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                {editMode ? 'edit_admin()' : 'create_admin()'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 font-mono text-sm">name:</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 font-mono text-sm">email:</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 font-mono text-sm">
                  password: {editMode && <span className="text-slate-600">(deixe vazio para manter)</span>}
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500 focus:ring-emerald-500/20"
                  required={!editMode}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 font-mono text-sm">phone:</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white font-mono"
                >
                  cancel()
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-mono font-semibold"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editMode ? 'update()' : 'create()'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-white font-mono flex items-center gap-2">
            <span className="text-emerald-400">&gt;</span> list_admins()
            <span className="text-slate-500 text-sm">// {admins.length} registros</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12">
            <Terminal className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-mono">// nenhum admin encontrado</p>
            <p className="text-slate-600 text-sm font-mono mt-1">execute new_admin() para criar</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {admins.map((admin, index) => (
              <div
                key={admin.id}
                className="p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                      <span className="text-emerald-400 font-mono font-bold">
                        {admin.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium font-mono">{admin.name}</p>
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded font-mono",
                          admin.user.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-700 text-slate-400 border border-slate-600"
                        )}>
                          {admin.user.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm font-mono">{admin.user.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-slate-600 text-xs font-mono">phone: {admin.phone}</span>
                        <span className="text-slate-600 text-xs font-mono">
                          created: {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(admin)}
                      className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(admin)}
                      className={cn(
                        "hover:bg-slate-800",
                        admin.user.isActive
                          ? "text-slate-400 hover:text-yellow-400"
                          : "text-slate-400 hover:text-emerald-400"
                      )}
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
                      className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-mono flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              delete_admin()
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono">
              <span className="text-slate-500">// ATENÇÃO: esta ação não pode ser desfeita</span>
              <br /><br />
              Tem certeza que deseja remover o administrador{' '}
              <strong className="text-white">{selectedAdmin?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white font-mono">
              cancel()
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-mono"
            >
              confirm_delete()
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
