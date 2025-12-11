'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
  onValidChange?: (isValid: boolean) => void
}

function formatPhoneNumber(value: string): string {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)
  
  // Aplica a máscara
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}

function getCleanNumber(value: string): string {
  return value.replace(/\D/g, '')
}

function isValidPhone(value: string): boolean {
  const numbers = value.replace(/\D/g, '')
  return numbers.length === 10 || numbers.length === 11
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = '', onChange, onValidChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    React.useEffect(() => {
      if (value) {
        setDisplayValue(formatPhoneNumber(value))
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formatted = formatPhoneNumber(inputValue)
      const clean = getCleanNumber(inputValue)
      
      setDisplayValue(formatted)
      
      if (onChange) {
        // Retorna o número limpo (apenas dígitos)
        onChange(clean)
      }
      
      if (onValidChange) {
        onValidChange(isValidPhone(clean))
      }
    }

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder="(65) 99999-9999"
        className={cn(className)}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput, formatPhoneNumber, getCleanNumber, isValidPhone }

