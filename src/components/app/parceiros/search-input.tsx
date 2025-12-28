'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  debounceMs?: number
}

export function SearchInput({
  value: externalValue,
  onChange,
  onSearch,
  placeholder = 'Buscar parceiros...',
  className,
  autoFocus = false,
  debounceMs = 300
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue || '')

  // Sync with external value
  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue)
    }
  }, [externalValue])

  // Debounced search
  useEffect(() => {
    if (!onSearch) return

    const timer = setTimeout(() => {
      onSearch(internalValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [internalValue, debounceMs, onSearch])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    onChange?.(newValue)
  }, [onChange])

  const handleClear = useCallback(() => {
    setInternalValue('')
    onChange?.('')
    onSearch?.('')
  }, [onChange, onSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(internalValue)
    }
  }, [internalValue, onSearch])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-10 pr-10 rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
      />
      {internalValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
