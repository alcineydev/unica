'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeColors {
  primary: string
  primaryLight: string
  secondary: string
  accent: string
  backgroundDark: string
  backgroundLight: string
  textDark: string
  textLight: string
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  colors: ThemeColors
  isLoading: boolean
}

const defaultColors: ThemeColors = {
  primary: '#1E3A8A',
  primaryLight: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  backgroundDark: '#0F172A',
  backgroundLight: '#F8FAFC',
  textDark: '#111827',
  textLight: '#F8FAFC'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  colors: defaultColors,
  isLoading: true
})

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Carregar cores do banco de dados
  useEffect(() => {
    const loadColors = async () => {
      try {
        const res = await fetch('/api/public/config')
        if (res.ok) {
          const data = await res.json()
          if (data && !data.error) {
            setColors({
              primary: data.color_primary || defaultColors.primary,
              primaryLight: data.color_primary_light || defaultColors.primaryLight,
              secondary: data.color_secondary || defaultColors.secondary,
              accent: data.color_accent || defaultColors.accent,
              backgroundDark: data.color_background_dark || defaultColors.backgroundDark,
              backgroundLight: data.color_background_light || defaultColors.backgroundLight,
              textDark: data.color_text_dark || defaultColors.textDark,
              textLight: data.color_text_light || defaultColors.textLight
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cores do tema:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadColors()
  }, [])

  // Carregar tema salvo do localStorage
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('unica_theme') as Theme | null
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme)
    } else {
      setThemeState('light')
    }
  }, [])

  // Aplicar tema e cores no documento
  const applyTheme = useCallback(() => {
    if (!mounted) return

    const root = document.documentElement

    // Aplicar classe do tema
    root.classList.remove('light', 'dark')
    root.classList.add(theme)

    // Aplicar CSS variables customizadas
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-light', colors.primaryLight)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-background-dark', colors.backgroundDark)
    root.style.setProperty('--color-background-light', colors.backgroundLight)
    root.style.setProperty('--color-text-dark', colors.textDark)
    root.style.setProperty('--color-text-light', colors.textLight)

    // Aplicar HSL para shadcn/ui
    const primaryHSL = hexToHSL(theme === 'dark' ? colors.primaryLight : colors.primary)
    const secondaryHSL = hexToHSL(colors.secondary)
    const accentHSL = hexToHSL(colors.accent)

    root.style.setProperty('--primary', primaryHSL)
    root.style.setProperty('--secondary', secondaryHSL)
    root.style.setProperty('--accent', accentHSL)

  }, [theme, colors, mounted])

  useEffect(() => {
    applyTheme()
  }, [applyTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('unica_theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
