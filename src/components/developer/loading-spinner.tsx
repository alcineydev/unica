'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
    className?: string
}

const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
}

const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
}

export function LoadingSpinner({
    size = 'lg',
    text = 'Carregando...',
    className
}: LoadingSpinnerProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
            {/* Spinner Premium */}
            <div className="relative">
                {/* Círculo externo */}
                <div className={cn(
                    'rounded-full border-4 border-zinc-700',
                    sizeClasses[size]
                )} />

                {/* Círculo animado principal */}
                <div className={cn(
                    'absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin',
                    sizeClasses[size]
                )} />

                {/* Círculo interno animado (efeito premium) */}
                <div
                    className="absolute inset-1 rounded-full border-2 border-transparent border-b-red-400 animate-spin"
                    style={{
                        animationDirection: 'reverse',
                        animationDuration: '0.7s'
                    }}
                />
            </div>

            {/* Texto */}
            {text && (
                <div className="flex flex-col items-center gap-1">
                    <p className={cn(
                        'font-medium text-zinc-300 animate-pulse',
                        textSizes[size]
                    )}>
                        {text}
                    </p>
                    {/* Dots animados */}
                    <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
        </div>
    )
}

// Componente para página inteira
export function PageLoading({ text = 'Carregando...' }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" text={text} />
        </div>
    )
}

// Componente para tabelas
export function TableLoading({ text = 'Carregando dados...' }: { text?: string }) {
    return (
        <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" text={text} />
        </div>
    )
}

// Componente para cards
export function CardLoading({ text = 'Carregando...' }: { text?: string }) {
    return (
        <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" text={text} />
        </div>
    )
}
