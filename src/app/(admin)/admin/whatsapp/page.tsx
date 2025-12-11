'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Plus, 
  RefreshCw, 
  Smartphone, 
  QrCode, 
  Trash2, 
  PowerOff,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface WhatsAppInstance {
  id: string
  name: string
  instanceId: string
  status: string
  phoneNumber: string | null
  profileName: string | null
  profilePic: string | null
  createdAt: string
}

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<{ instanceId: string; qrCode: string } | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [loadingQr, setLoadingQr] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchInstances()
  }, [])

  async function fetchInstances() {
    try {
      const response = await fetch('/api/admin/whatsapp/instances')
      const data = await response.json()
      setInstances(data)
    } catch (error) {
      toast.error('Erro ao carregar instâncias')
    } finally {
      setLoading(false)
    }
  }

  async function createInstance() {
    if (!newInstanceName.trim()) {
      toast.error('Digite um nome para a instância')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newInstanceName }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Instância criada com sucesso!')
        setNewInstanceName('')
        setDialogOpen(false)
        fetchInstances()
      } else {
        toast.error(data.error || 'Erro ao criar instância')
      }
    } catch (error) {
      toast.error('Erro ao criar instância')
    } finally {
      setCreating(false)
    }
  }

  async function deleteInstance(id: string, instanceId: string) {
    try {
      const response = await fetch(`/api/admin/whatsapp/instances/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId }),
      })

      if (response.ok) {
        toast.success('Instância removida com sucesso!')
        fetchInstances()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao remover instância')
      }
    } catch (error) {
      toast.error('Erro ao remover instância')
    }
  }

  async function connectInstance(instanceId: string) {
    setLoadingQr(true)
    setQrDialogOpen(true)
    
    try {
      const response = await fetch(`/api/admin/whatsapp/qrcode/${instanceId}`)
      const data = await response.json()

      if (response.ok && data.qrCode) {
        setQrCodeData({ instanceId, qrCode: data.qrCode })
      } else if (data.status === 'connected') {
        toast.success('WhatsApp já está conectado!')
        setQrDialogOpen(false)
        fetchInstances()
      } else {
        toast.error(data.error || 'Erro ao obter QR Code')
        setQrDialogOpen(false)
      }
    } catch (error) {
      toast.error('Erro ao obter QR Code')
      setQrDialogOpen(false)
    } finally {
      setLoadingQr(false)
    }
  }

  async function disconnectInstance(instanceId: string) {
    try {
      const response = await fetch(`/api/admin/whatsapp/disconnect/${instanceId}`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('WhatsApp desconectado!')
        fetchInstances()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao desconectar')
      }
    } catch (error) {
      toast.error('Erro ao desconectar')
    }
  }

  async function refreshStatus(id: string, instanceId: string) {
    setRefreshingStatus(id)
    try {
      const response = await fetch(`/api/admin/whatsapp/status/${instanceId}`)
      const data = await response.json()

      if (response.ok) {
        // Atualizar status no banco
        await fetch(`/api/admin/whatsapp/instances/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: data.status,
            phoneNumber: data.phoneNumber,
            profileName: data.profileName,
            profilePic: data.profilePic,
          }),
        })
        fetchInstances()
        toast.success('Status atualizado!')
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    } finally {
      setRefreshingStatus(null)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Conectando</Badge>
      default:
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Desconectado</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp</h2>
          <p className="text-muted-foreground">Gerencie as instâncias do WhatsApp para notificações</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Instância
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Instância</DialogTitle>
              <DialogDescription>
                Crie uma nova instância do WhatsApp para enviar notificações
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Instância</Label>
                <Input
                  id="name"
                  placeholder="Ex: Principal, Suporte, Marketing..."
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createInstance} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {creating ? 'Criando...' : 'Criar Instância'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            {loadingQr ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : qrCodeData?.qrCode ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={qrCodeData.qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Abra o WhatsApp no seu celular, vá em Configurações → Aparelhos conectados → Conectar um aparelho
                </p>
                <Button variant="outline" onClick={() => connectInstance(qrCodeData.instanceId)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar QR Code
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Erro ao carregar QR Code</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de Instâncias */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instances.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma instância</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie sua primeira instância do WhatsApp para começar a enviar notificações
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Instância
              </Button>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{instance.name}</CardTitle>
                  {getStatusBadge(instance.status)}
                </div>
                <CardDescription className="text-xs">
                  ID: {instance.instanceId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {instance.status === 'connected' && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {instance.profilePic && (
                      <img 
                        src={instance.profilePic} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{instance.profileName || 'WhatsApp'}</p>
                      <p className="text-xs text-muted-foreground">{instance.phoneNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {instance.status === 'connected' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => disconnectInstance(instance.instanceId)}
                    >
                      <PowerOff className="h-4 w-4 mr-1" />
                      Desconectar
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => connectInstance(instance.instanceId)}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Conectar
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => refreshStatus(instance.id, instance.instanceId)}
                    disabled={refreshingStatus === instance.id}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingStatus === instance.id ? 'animate-spin' : ''}`} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover instância?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá remover a instância &quot;{instance.name}&quot; e desconectar o WhatsApp. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteInstance(instance.id, instance.instanceId)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

