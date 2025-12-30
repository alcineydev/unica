import { cn } from '@/lib/utils'

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusBadgeProps {
  status: StatusType
  label: string
  dot?: boolean
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
}

const dotStyles: Record<StatusType, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-500',
}

export function StatusBadge({ status, label, dot = true }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      statusStyles[status]
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotStyles[status])} />}
      {label}
    </span>
  )
}

// Helper para mapear status do sistema para o componente
export function getSubscriptionStatus(status: string | null | undefined): { type: StatusType; label: string } {
  const map: Record<string, { type: StatusType; label: string }> = {
    ACTIVE: { type: 'success', label: 'Ativo' },
    PENDING: { type: 'warning', label: 'Pendente' },
    CANCELLED: { type: 'danger', label: 'Cancelado' },
    CANCELED: { type: 'danger', label: 'Cancelado' },
    EXPIRED: { type: 'danger', label: 'Expirado' },
    INACTIVE: { type: 'neutral', label: 'Inativo' },
    SUSPENDED: { type: 'warning', label: 'Suspenso' },
    TRIAL: { type: 'info', label: 'Trial' },
  }
  return map[status || ''] || { type: 'neutral', label: status || 'Desconhecido' }
}

export function getPlanStatus(status: string | null | undefined): { type: StatusType; label: string } {
  const map: Record<string, { type: StatusType; label: string }> = {
    ACTIVE: { type: 'success', label: 'Ativo' },
    INACTIVE: { type: 'neutral', label: 'Inativo' },
    DRAFT: { type: 'warning', label: 'Rascunho' },
  }
  return map[status || ''] || { type: 'neutral', label: status || 'Desconhecido' }
}

export function getParceiroStatus(isActive: boolean): { type: StatusType; label: string } {
  return isActive
    ? { type: 'success', label: 'Ativo' }
    : { type: 'neutral', label: 'Inativo' }
}

export function getPaymentStatus(status: string | null | undefined): { type: StatusType; label: string } {
  const map: Record<string, { type: StatusType; label: string }> = {
    PAID: { type: 'success', label: 'Pago' },
    PENDING: { type: 'warning', label: 'Pendente' },
    FAILED: { type: 'danger', label: 'Falhou' },
    REFUNDED: { type: 'info', label: 'Reembolsado' },
    CANCELLED: { type: 'neutral', label: 'Cancelado' },
  }
  return map[status || ''] || { type: 'neutral', label: status || 'Desconhecido' }
}
