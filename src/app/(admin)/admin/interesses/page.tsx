'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Handshake,
  Search,
  Loader2,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Trash2,
  Eye,
  Users,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

interface Interesse {
  id: string
  nome: string
  email: string
  telefone: string
  nomeEmpresa: string
  cidade: string
  status: string
  observacoes: string | null
  createdAt: string
}

interface Stats {
  total: number
  pendentes: number
  contatados: number
  convertidos: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
  CONTATADO: { label: 'Contatado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Phone },
  CONVERTIDO: { label: 'Convertido', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  REJEITADO: { label: 'Rejeitado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle }
}

export default function InteressesPage() {
  const [interesses, setInteresses] = useState<Interesse[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pendentes: 0, contatados: 0, convertidos: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modal states
  const [selectedInteresse, setSelectedInteresse] = useState<Interesse | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchInteresses()
  }, [statusFilter])

  const fetchInteresses = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/admin/interesses?${params}`)
      const data = await response.json()
      
      if (data.interesses) {
        setInteresses(data.interesses)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao buscar interesses:', error)
      toast.error('Erro ao carregar interesses')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/interesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })

      if (response.ok) {
        toast.success('Status atualizado!')
        fetchInteresses()
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch (error) {
      toast.error('Erro ao atualizar')
    } finally {
      setIsUpdating(false)
    }
  }

  const saveObservacoes = async () => {
    if (!selectedInteresse) return
    
    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/interesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedInteresse.id, observacoes })
      })

      if (response.ok) {
        toast.success('Observações salvas!')
        setIsDetailOpen(false)
        fetchInteresses()
      } else {
        toast.error('Erro ao salvar')
      }
    } catch (error) {
      toast.error('Erro ao salvar')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteInteresse = async () => {
    if (!selectedInteresse) return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/interesses?id=${selectedInteresse.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Interesse removido!')
        setIsDeleteOpen(false)
        fetchInteresses()
      } else {
        toast.error('Erro ao remover')
      }
    } catch (error) {
      toast.error('Erro ao remover')
    } finally {
      setIsUpdating(false)
    }
  }

  const openDetail = (interesse: Interesse) => {
    setSelectedInteresse(interesse)
    setObservacoes(interesse.observacoes || '')
    setIsDetailOpen(true)
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredInteresses = interesses.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase()) ||
    i.nomeEmpresa.toLowerCase().includes(search.toLowerCase()) ||
    i.cidade.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Handshake className="h-6 w-6" />
          Interesses de Parceiros
        </h1>
        <p className="text-muted-foreground">
          Empresas interessadas em se tornar parceiras
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.contatados}</p>
                <p className="text-xs text-muted-foreground">Contatados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.convertidos}</p>
                <p className="text-xs text-muted-foreground">Convertidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, empresa..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="CONTATADO">Contatados</SelectItem>
                <SelectItem value="CONVERTIDO">Convertidos</SelectItem>
                <SelectItem value="REJEITADO">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {filteredInteresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum interesse encontrado</h3>
            <p className="text-muted-foreground">
              {search ? 'Tente outro termo de busca' : 'Aguardando novos interessados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInteresses.map((interesse) => {
            const statusInfo = statusConfig[interesse.status] || statusConfig.PENDENTE
            const StatusIcon = statusInfo.icon
            
            return (
              <Card key={interesse.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Info Principal */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{interesse.nomeEmpresa}</h3>
                          <p className="text-sm text-muted-foreground">{interesse.nome}</p>
                        </div>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {interesse.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {formatPhone(interesse.telefone)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {interesse.cidade}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(interesse.createdAt)}
                        </span>
                      </div>
                      
                      {interesse.observacoes && (
                        <p className="text-sm bg-muted p-2 rounded">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {interesse.observacoes}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={interesse.status}
                        onValueChange={(value) => updateStatus(interesse.id, value)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="CONTATADO">Contatado</SelectItem>
                          <SelectItem value="CONVERTIDO">Convertido</SelectItem>
                          <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(interesse)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`https://wa.me/55${interesse.telefone.replace(/\D/g, '')}`, '_blank')}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`mailto:${interesse.email}`, '_blank')}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setSelectedInteresse(interesse); setIsDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Interesse</DialogTitle>
            <DialogDescription>
              {selectedInteresse?.nomeEmpresa}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInteresse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contato</p>
                  <p className="font-medium">{selectedInteresse.nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Empresa</p>
                  <p className="font-medium">{selectedInteresse.nomeEmpresa}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedInteresse.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{formatPhone(selectedInteresse.telefone)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cidade</p>
                  <p className="font-medium">{selectedInteresse.cidade}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(selectedInteresse.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  placeholder="Adicione observações sobre este contato..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveObservacoes} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir interesse?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O interesse de &quot;{selectedInteresse?.nomeEmpresa}&quot; será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteInteresse} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

