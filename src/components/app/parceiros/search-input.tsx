'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Buscar...',
  className,
  autoFocus = false
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const isFirstRender = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar valor externo apenas na primeira renderização
  useEffect(() => {
    if (isFirstRender.current) {
      setLocalValue(value)
      isFirstRender.current = false
    }
  }, [value])

  // Debounce - chamar onChange após parar de digitar
  useEffect(() => {
    if (isFirstRender.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue]) // Remover onChange e value das dependências para evitar loop

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-10 pr-10 h-12 rounded-xl bg-gray-100 border-0"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
