'use client'

import { cn } from '@/lib/utils'
import {
    UserPlus,
    UserMinus,
    UserCheck,
    UserX,
    LogIn,
    LogOut,
    Settings,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle,
    Edit,
    Trash,
    Eye,
    Mail,
    CreditCard,
    Bell,
} from 'lucide-react'

interface LogBadgeProps {
    action: string
    className?: string
}

const actionConfig: Record<string, {
    label: string
    icon: React.ElementType
    color: string
}> = {
    // Admin actions
    CREATE_ADMIN: { label: 'Admin Criado', icon: UserPlus, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    DELETE_ADMIN: { label: 'Admin Removido', icon: UserMinus, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ACTIVATE_ADMIN: { label: 'Admin Ativado', icon: UserCheck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    DEACTIVATE_ADMIN: { label: 'Admin Desativado', icon: UserX, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    UPDATE_ADMIN: { label: 'Admin Atualizado', icon: Edit, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },

    // Auth actions
    LOGIN: { label: 'Login', icon: LogIn, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    LOGOUT: { label: 'Logout', icon: LogOut, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
    LOGIN_FAILED: { label: 'Login Falhou', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },

    // CRUD actions
    CREATE: { label: 'Criado', icon: UserPlus, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    UPDATE: { label: 'Atualizado', icon: Edit, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    DELETE: { label: 'Removido', icon: Trash, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    VIEW: { label: 'Visualizado', icon: Eye, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },

    // System actions
    CONFIG_UPDATE: { label: 'Config Atualizada', icon: Settings, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    EMAIL_SENT: { label: 'Email Enviado', icon: Mail, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    PAYMENT: { label: 'Pagamento', icon: CreditCard, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    NOTIFICATION: { label: 'Notificação', icon: Bell, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },

    // Levels
    INFO: { label: 'Info', icon: Info, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    WARN: { label: 'Aviso', icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    ERROR: { label: 'Erro', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    SUCCESS: { label: 'Sucesso', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

export function LogBadge({ action, className }: LogBadgeProps) {
    const config = actionConfig[action] || {
        label: action,
        icon: Info,
        color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    }

    const Icon = config.icon

    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
            config.color,
            className
        )}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    )
}

// Badge de nível (INFO, WARN, ERROR)
export function LevelBadge({ level, className }: { level: string; className?: string }) {
    const config = {
        INFO: { label: 'Info', color: 'bg-blue-500/20 text-blue-400' },
        WARN: { label: 'Aviso', color: 'bg-amber-500/20 text-amber-400' },
        ERROR: { label: 'Erro', color: 'bg-red-500/20 text-red-400' },
        DEBUG: { label: 'Debug', color: 'bg-zinc-500/20 text-zinc-400' },
    }[level] || { label: level, color: 'bg-zinc-500/20 text-zinc-400' }

    return (
        <span className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
            config.color,
            className
        )}>
            {config.label}
        </span>
    )
}
