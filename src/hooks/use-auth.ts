'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface LoginCredentials {
  email: string
  password: string
}

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const user = session?.user

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: 'Email ou senha inválidos' }
      }

      // Redireciona baseado no role após login bem-sucedido
      // O middleware vai cuidar de redirecionar para a área correta
      router.refresh()
      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Ocorreu um erro ao fazer login' }
    }
  }, [router])

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

