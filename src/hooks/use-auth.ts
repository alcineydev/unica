'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useCallback } from 'react'

interface LoginCredentials {
  email: string
  password: string
}

interface LoginResult {
  success: boolean
  error?: string
  redirectUrl?: string
}

export function useAuth() {
  const { data: session, status, update } = useSession()

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const user = session?.user

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: 'Email ou senha inválidos' }
      }

      if (result?.ok) {
        // Buscar a sessão atualizada para pegar o role
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()
        
        const role = sessionData?.user?.role
        let redirectUrl = '/login'
        
        switch (role) {
          case 'DEVELOPER':
            redirectUrl = '/developer'
            break
          case 'ADMIN':
            redirectUrl = '/admin'
            break
          case 'PARCEIRO':
            redirectUrl = '/parceiro'
            break
          case 'ASSINANTE':
            redirectUrl = '/app'
            break
        }

        return { success: true, redirectUrl }
      }

      return { success: false, error: 'Erro ao fazer login' }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Ocorreu um erro ao fazer login' }
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
  }, [])

  const getRedirectUrl = useCallback(() => {
    if (!user?.role) return '/login'
    
    switch (user.role) {
      case 'DEVELOPER':
        return '/developer'
      case 'ADMIN':
        return '/admin'
      case 'PARCEIRO':
        return '/parceiro'
      case 'ASSINANTE':
        return '/app'
      default:
        return '/login'
    }
  }, [user?.role])

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    update,
    getRedirectUrl,
  }
}
