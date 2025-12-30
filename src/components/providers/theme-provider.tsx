'use client'

import { createContext, useContext, useEffect } from 'react'

// TEMA: Apenas claro - Dark mode DESATIVADO

interface ThemeContextType {
  theme: 'light'
  setTheme: (theme: string) => void
  resolvedTheme: 'light'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  resolvedTheme: 'light',
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Forçar tema claro ao montar
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')

    // Limpar qualquer preferência de tema salva
    localStorage.removeItem('unica_theme')
    localStorage.removeItem('theme')
  }, [])

  // setTheme é um no-op - sempre usa tema claro
  const setTheme = () => {
    // Não faz nada - tema é sempre claro
  }

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme, resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
