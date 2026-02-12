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

      {/* MODALS - Continuação no próximo arquivo devido ao limite de tamanho */}
    </div>
  )
}
