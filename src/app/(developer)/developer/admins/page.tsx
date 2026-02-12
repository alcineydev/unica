'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Phone,
  Calendar,
  KeyRound,
} from 'lucide-react'
import { PageLoading, PageHeader, FilterBar } from '@/components/developer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Admin {
  id: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  name: string | null
  adminId: string | null
}

export default function AdminsPage() {
  // Estados principais
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  // Estados dos modais
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)

  // Admin selecionado para ações
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)

  // Estados do formulário de criar
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [creating, setCreating] = useState(false)

  // Estados do formulário de editar
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    password: '',
  })
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editing, setEditing] = useState(false)

  // Estados do formulário de alterar email
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    code: '',
  })
  const [emailStep, setEmailStep] = useState<'request' | 'verify'>('request')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  // Estados de ações
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Buscar admins
  const fetchAdmins = useCallback(async () => {
    try {
      setRefreshing(true)
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
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  // Filtrar admins
  const filteredAdmins = admins.filter((admin) => {
    const searchLower = search.toLowerCase()
    return (
      admin.name?.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower) ||
      admin.phone?.toLowerCase().includes(searchLower)
    )
  })

  // Criar admin
  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (createForm.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/developer/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        toast.success('Administrador criado com sucesso!')
        setCreateDialogOpen(false)
        setCreateForm({ name: '', email: '', phone: '', password: '' })
        fetchAdmins()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar administrador')
      }
    } catch (error) {
      toast.error('Erro ao criar administrador')
    } finally {
      setCreating(false)
    }
  }

  // Editar admin
  const handleEdit = async () => {
    if (!selectedAdmin) return

    setEditing(true)
    try {
      const updateData: Record<string, string> = {}
      if (editForm.name) updateData.name = editForm.name
      if (editForm.phone !== undefined) updateData.phone = editForm.phone
      if (editForm.password && editForm.password.length >= 6) {
        updateData.password = editForm.password
      }

      const response = await fetch(`/api/developer/admins/${selectedAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast.success('Administrador atualizado com sucesso!')
        setEditDialogOpen(false)
        setSelectedAdmin(null)
        setEditForm({ name: '', phone: '', password: '' })
        fetchAdmins()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao atualizar administrador')
      }
    } catch (error) {
      toast.error('Erro ao atualizar administrador')
    } finally {
      setEditing(false)
    }
  }

  // Abrir modal de edição
  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setEditForm({
      name: admin.name || '',
      phone: admin.phone || '',
      password: '',
    })
    setShowEditPassword(false)
    setEditDialogOpen(true)
  }

  // Abrir modal de alteração de email
  const openEmailDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setEmailForm({ newEmail: '', code: '' })
    setEmailStep('request')
    setEmailDialogOpen(true)
  }

  // Enviar código de verificação
  const handleSendCode = async () => {
    if (!selectedAdmin || !emailForm.newEmail) {
      toast.error('Digite o novo email')
      return
    }

    setSendingCode(true)
    try {
      const response = await fetch('/api/developer/admins/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: selectedAdmin.id,
          newEmail: emailForm.newEmail,
        }),
      })

      if (response.ok) {
        toast.success('Código enviado para o email atual!')
        setEmailStep('verify')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao enviar código')
      }
    } catch (error) {
      toast.error('Erro ao enviar código')
    } finally {
      setSendingCode(false)
    }
  }

  // Verificar código
  const handleVerifyCode = async () => {
    if (!selectedAdmin || !emailForm.code) {
      toast.error('Digite o código de verificação')
      return
    }

    setVerifyingCode(true)
    try {
      const response = await fetch('/api/developer/admins/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: selectedAdmin.id,
          code: emailForm.code,
        }),
      })

      if (response.ok) {
        toast.success('Email alterado com sucesso!')
        setEmailDialogOpen(false)
        setSelectedAdmin(null)
        setEmailForm({ newEmail: '', code: '' })
        fetchAdmins()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Código inválido')
      }
    } catch (error) {
      toast.error('Erro ao verificar código')
    } finally {
      setVerifyingCode(false)
    }
  }

  // Ativar/Desativar admin
  const handleToggle = async () => {
    if (!selectedAdmin) return

    setToggling(true)
    try {
      const response = await fetch(`/api/developer/admins/${selectedAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !selectedAdmin.isActive }),
      })

      if (response.ok) {
        toast.success(
          selectedAdmin.isActive
            ? 'Administrador desativado!'
            : 'Administrador ativado!'
        )
        setToggleDialogOpen(false)
        setSelectedAdmin(null)
        fetchAdmins()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao alterar status')
      }
    } catch (error) {
      toast.error('Erro ao alterar status')
    } finally {
      setToggling(false)
    }
  }

  // Excluir admin
  const handleDelete = async () => {
    if (!selectedAdmin) return

    if (deleteConfirmText !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/developer/admins/${selectedAdmin.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Administrador excluído com sucesso!')
        setDeleteDialogOpen(false)
        setSelectedAdmin(null)
        setDeleteConfirmText('')
        fetchAdmins()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao excluir administrador')
      }
    } catch (error) {
      toast.error('Erro ao excluir administrador')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <PageLoading text="Carregando administradores..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Administradores"
        description="Gerencie os administradores do sistema"
        icon={<Users className="h-6 w-6" />}
        badge={{ text: `${admins.length} admin${admins.length !== 1 ? 's' : ''}`, variant: 'default' }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchAdmins()}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              onClick={() => {
                setCreateForm({ name: '', email: '', phone: '', password: '' })
                setShowCreatePassword(false)
                setCreateDialogOpen(true)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Admin
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar por nome, email ou telefone...',
        }}
        totalResults={filteredAdmins.length}
      />

      {/* Tabela */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
        {filteredAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-lg font-medium text-zinc-400">
              {search ? 'Nenhum administrador encontrado' : 'Nenhum administrador cadastrado'}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {search ? 'Tente ajustar a busca' : 'Clique em "Novo Admin" para criar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Administrador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 hidden md:table-cell">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 hidden lg:table-cell">
                    Criado em
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {admin.name || 'Sem nome'}
                          </p>
                          <p className="text-sm text-zinc-400">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Phone className="h-4 w-4" />
                        {admin.phone || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(admin.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {admin.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/30">
                          <XCircle className="h-3 w-3" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Editar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(admin)}
                          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Alterar Email */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEmailDialog(admin)}
                          className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/20"
                          title="Alterar Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        {/* Ativar/Desativar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAdmin(admin)
                            setToggleDialogOpen(true)
                          }}
                          className={cn(
                            'h-8 w-8',
                            admin.isActive
                              ? 'text-zinc-400 hover:text-amber-400 hover:bg-amber-500/20'
                              : 'text-zinc-400 hover:text-green-400 hover:bg-green-500/20'
                          )}
                          title={admin.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {admin.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Excluir */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAdmin(admin)
                            setDeleteConfirmText('')
                            setDeleteDialogOpen(true)
                          }}
                          className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/20"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Criar Admin */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-red-400" />
              Novo Administrador
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Preencha os dados para criar um novo administrador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Nome do administrador"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Email *</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Telefone</Label>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Senha *</Label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-zinc-800 border-zinc-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {creating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Editar Admin */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-400" />
              Editar Administrador
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Altere os dados do administrador. Deixe a senha em branco para não alterá-la.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome do administrador"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Telefone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Nova Senha (opcional)</Label>
              <div className="relative">
                <Input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Deixe em branco para não alterar"
                  className="bg-zinc-800 border-zinc-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-400">
                💡 Para alterar o email, use o botão de email na tabela.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Alterar Email */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-400" />
              Alterar Email
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {emailStep === 'request'
                ? 'Digite o novo email. Um código será enviado para o email atual.'
                : 'Digite o código de 4 dígitos enviado para o email atual.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info do admin */}
            <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <p className="text-sm text-zinc-400">Email atual:</p>
              <p className="font-medium text-white">{selectedAdmin?.email}</p>
            </div>

            {emailStep === 'request' ? (
              <div className="space-y-2">
                <Label className="text-zinc-300">Novo Email</Label>
                <Input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  placeholder="novo@email.com"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-zinc-300">Código de Verificação</Label>
                <Input
                  value={emailForm.code}
                  onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="0000"
                  className="bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={4}
                />
                <p className="text-xs text-zinc-500 text-center">
                  O código foi enviado para {selectedAdmin?.email}
                </p>
              </div>
            )}

            {emailStep === 'verify' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-400">
                  ⏱️ O código expira em 10 minutos.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            {emailStep === 'request' ? (
              <Button
                onClick={handleSendCode}
                disabled={sendingCode}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {sendingCode ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Enviar Código
              </Button>
            ) : (
              <Button
                onClick={handleVerifyCode}
                disabled={verifyingCode || emailForm.code.length !== 4}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {verifyingCode ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verificar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ALERT: Ativar/Desativar */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedAdmin?.isActive ? (
                <PowerOff className="h-5 w-5 text-amber-400" />
              ) : (
                <Power className="h-5 w-5 text-green-400" />
              )}
              {selectedAdmin?.isActive ? 'Desativar' : 'Ativar'} Administrador
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja {selectedAdmin?.isActive ? 'desativar' : 'ativar'}{' '}
              <strong className="text-white">{selectedAdmin?.name || selectedAdmin?.email}</strong>?
              {selectedAdmin?.isActive && (
                <span className="block mt-2 text-amber-400">
                  O administrador não conseguirá acessar o sistema.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              disabled={toggling}
              className={cn(
                selectedAdmin?.isActive
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-green-600 hover:bg-green-700',
                'text-white'
              )}
            >
              {toggling ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : selectedAdmin?.isActive ? (
                <PowerOff className="h-4 w-4 mr-2" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              {selectedAdmin?.isActive ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ALERT: Excluir */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Excluir Administrador
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 space-y-3">
              <span className="block">
                Tem certeza que deseja excluir{' '}
                <strong className="text-white">{selectedAdmin?.name || selectedAdmin?.email}</strong>?
              </span>
              <span className="block text-red-400">
                ⚠️ Esta ação não pode ser desfeita. O administrador será removido permanentemente.
              </span>
              <div className="pt-2">
                <Label className="text-zinc-300">Digite EXCLUIR para confirmar:</Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="EXCLUIR"
                  className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || deleteConfirmText !== 'EXCLUIR'}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {deleting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
