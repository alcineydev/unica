'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

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
  theme: 'system',
  setTheme: () => {},
  colors: defaultColors,
  isLoading: true
})

// Converter HEX para HSL (formato que shadcn/ui usa)
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

// Função para aplicar cores no documento (pode ser chamada antes do React montar)
function applyColorsToDocument(colorsToApply: ThemeColors, activeTheme: 'light' | 'dark') {
  const root = document.documentElement

  // CSS Variables customizadas (HEX)
  root.style.setProperty('--color-primary', colorsToApply.primary)
  root.style.setProperty('--color-primary-light', colorsToApply.primaryLight)
  root.style.setProperty('--color-secondary', colorsToApply.secondary)
  root.style.setProperty('--color-accent', colorsToApply.accent)
  root.style.setProperty('--color-background-dark', colorsToApply.backgroundDark)
  root.style.setProperty('--color-background-light', colorsToApply.backgroundLight)
  root.style.setProperty('--color-text-dark', colorsToApply.textDark)
  root.style.setProperty('--color-text-light', colorsToApply.textLight)

  // Converter para HSL e aplicar nas variáveis do shadcn/ui
  const primaryHSL = hexToHSL(colorsToApply.primary)
  const primaryLightHSL = hexToHSL(colorsToApply.primaryLight)
  const secondaryHSL = hexToHSL(colorsToApply.secondary)
  const accentHSL = hexToHSL(colorsToApply.accent)

  // Aplicar cores HSL para shadcn/ui baseado no tema
  if (activeTheme === 'dark') {
    root.style.setProperty('--primary', primaryLightHSL)
    root.style.setProperty('--secondary', secondaryHSL)
    root.style.setProperty('--accent', accentHSL)
    root.style.setProperty('--background', hexToHSL(colorsToApply.backgroundDark))
    root.style.setProperty('--foreground', hexToHSL(colorsToApply.textLight))
  } else {
    root.style.setProperty('--primary', primaryHSL)
    root.style.setProperty('--secondary', secondaryHSL)
    root.style.setProperty('--accent', accentHSL)
    root.style.setProperty('--background', hexToHSL(colorsToApply.backgroundLight))
    root.style.setProperty('--foreground', hexToHSL(colorsToApply.textDark))
  }

  // Ring e outras variáveis relacionadas
  root.style.setProperty('--ring', primaryHSL)

  console.log('[ThemeProvider] Cores aplicadas:', {
    theme: activeTheme,
    primary: colorsToApply.primary,
    primaryHSL,
    secondary: colorsToApply.secondary,
    secondaryHSL
  })
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Função para obter tema ativo
  const getActiveTheme = useCallback((currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    }
    return currentTheme
  }, [])

  // Carregar cores do banco de dados
  useEffect(() => {
    const loadColors = async () => {
      try {
        const res = await fetch('/api/public/config')
        if (res.ok) {
          const data = await res.json()
          if (data && !data.error) {
            const newColors = {
              primary: data.color_primary || defaultColors.primary,
              primaryLight: data.color_primary_light || defaultColors.primaryLight,
              secondary: data.color_secondary || defaultColors.secondary,
              accent: data.color_accent || defaultColors.accent,
              backgroundDark: data.color_background_dark || defaultColors.backgroundDark,
              backgroundLight: data.color_background_light || defaultColors.backgroundLight,
              textDark: data.color_text_dark || defaultColors.textDark,
              textLight: data.color_text_light || defaultColors.textLight
            }
            setColors(newColors)

            // Aplicar cores imediatamente após carregar
            const savedTheme = localStorage.getItem('theme') as Theme | null
            const currentTheme = savedTheme || 'system'
            const activeTheme = getActiveTheme(currentTheme)
            applyColorsToDocument(newColors, activeTheme)
          }
        }
      } catch (error) {
        console.error('[ThemeProvider] Erro ao carregar cores:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadColors()
  }, [getActiveTheme])

  // Carregar tema salvo do localStorage
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  // Aplicar tema e cores quando mudar
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const activeTheme = getActiveTheme(theme)

    // Aplicar classe do tema
    root.classList.remove('light', 'dark')
    root.classList.add(activeTheme)

    // Aplicar cores
    applyColorsToDocument(colors, activeTheme)

  }, [theme, colors, mounted, getActiveTheme])

  // Listener para mudanças no tema do sistema
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const activeTheme = mediaQuery.matches ? 'dark' : 'light'
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(activeTheme)
      applyColorsToDocument(colors, activeTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, colors])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
