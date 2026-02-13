'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  User,
  MapPin,
  Crown,
  Receipt,
  Activity,
  AlertTriangle,
} from 'lucide-react'
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

import SubscriberSidebar from './components/subscriber-sidebar'
import SubscriberPersonalTab from './components/subscriber-personal-tab'
import SubscriberAddressTab from './components/subscriber-address-tab'
import SubscriberPlanTab from './components/subscriber-plan-tab'
import SubscriberFinancialTab from './components/subscriber-financial-tab'
import SubscriberActivityTab from './components/subscriber-activity-tab'

interface Stats {
  totalTransactions?: number
  totalSpent?: number
  totalCashback?: number
  totalPointsUsed?: number
  totalDiscounts?: number
}

interface Charts {
  timeline: { month: string; total: number; count: number }[]
  byType: { type: string; count: number; total: number }[]
}

export default function EditarAssinantePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [assinante, setAssinante] = useState<Record<string, unknown> | null>(
    null
  )
  const [plans, setPlans] = useState<Record<string, unknown>[]>([])
  const [cities, setCities] = useState<
    { id: string; name: string; state: string }[]
  >([])
  const [stats, setStats] = useState<Stats>({})
  const [charts, setCharts] = useState<Charts>({
    timeline: [],
    byType: [],
  })

  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Carregar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/assinantes/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Assinante não encontrado')
          router.push('/admin/assinantes')
          return
        }
        throw new Error('Erro ao carregar dados')
      }

      const data = await res.json()
      const sub = data.data || data

      setAssinante(sub)
      setPlans(data.plans || [])
      setCities(data.cities || [])
      setStats(data.stats || {})
      setCharts(data.charts || { timeline: [], byType: [] })

      const user = sub.user as Record<string, unknown> | undefined

      // Inicializar formData
      setFormData({
        name: (sub.name as string) || '',
        email: (user?.email as string) || '',
        cpf: (sub.cpf as string) || '',
        phone: (sub.phone as string) || (user?.phone as string) || '',
        birthDate: sub.birthDate || null,
        password: '',
        address: sub.address || {},
        planStartDate: sub.planStartDate || null,
        planEndDate: sub.planEndDate || null,
        nextBillingDate: sub.nextBillingDate || null,
        points: sub.points || 0,
        cashback: sub.cashback || 0,
      })
      setHasChanges(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar assinante'
      )
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (id) fetchData()
  }, [id, fetchData])

  // Atualizar formData
  const updateFormData = (data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setHasChanges(true)
  }

  // Atualizar diretamente via sidebar (status, plano, cidade, ativo)
  const updateDirect = async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/assinantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar')
      }

      toast.success('Atualizado!')
      await fetchData()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar'
      )
    } finally {
      setSaving(false)
    }
  }

  // Salvar formulário
  const handleSave = async () => {
    if (!(formData.name as string)?.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)
    try {
      const payload = { ...formData }

      // Não enviar senha vazia
      if (!payload.password) delete payload.password

      const res = await fetch(`/api/admin/assinantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }

      toast.success('Assinante atualizado com sucesso!')
      setHasChanges(false)
      await fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Excluir
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/assinantes/${id}?force=true`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao excluir')
      }

      toast.success('Assinante excluído!')
      router.push('/admin/assinantes')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!assinante) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/assinantes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {assinante.name as string}
            </h1>
            <p className="text-sm text-muted-foreground">
              {(assinante.user as Record<string, unknown>)?.email as string}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Excluir */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Excluir Assinante
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir{' '}
                  <strong>{assinante.name as string}</strong>? Esta ação não
                  pode ser desfeita. Todos os dados, transações e histórico
                  serão removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Salvar */}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Layout: Tabs + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Conteúdo Principal */}
        <div>
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger
                value="personal"
                className="flex items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dados Pessoais</span>
                <span className="sm:hidden">Pessoal</span>
              </TabsTrigger>
              <TabsTrigger
                value="address"
                className="flex items-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5" />
                Endereço
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="flex items-center gap-1.5"
              >
                <Crown className="h-3.5 w-3.5" />
                Plano
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="flex items-center gap-1.5"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Financeiro</span>
                <span className="sm:hidden">Fin.</span>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex items-center gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Atividade</span>
                <span className="sm:hidden">Ativ.</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <SubscriberPersonalTab
                formData={formData}
                onChange={updateFormData}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="address">
              <SubscriberAddressTab
                formData={formData}
                onChange={updateFormData}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="plan">
              <SubscriberPlanTab
                assinante={assinante}
                formData={formData}
                onChange={updateFormData}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="financial">
              <SubscriberFinancialTab assinante={assinante} stats={stats} />
            </TabsContent>

            <TabsContent value="activity">
              <SubscriberActivityTab
                assinante={assinante}
                charts={charts}
                stats={stats}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="order-first lg:order-last">
          <SubscriberSidebar
            assinante={assinante}
            plans={plans as { id: string; name: string; price: number | string; period?: string; features?: string[] }[]}
            cities={cities}
            stats={stats}
            onUpdate={updateDirect}
            saving={saving}
          />
        </div>
      </div>
    </div>
  )
}
