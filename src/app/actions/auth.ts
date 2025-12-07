'use server'

import { signIn, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export interface LoginState {
  error?: string
  success?: boolean
}

/**
 * Server Action para login
 */
export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { error: 'Preencha todos os campos' }
    }

    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email ou senha inválidos' }
        default:
          return { error: 'Ocorreu um erro ao fazer login' }
      }
    }
    throw error
  }
}

/**
 * Server Action para logout
 */
export async function logoutAction() {
  await signOut({ redirect: false })
  redirect('/login')
}

/**
 * Server Action para verificar autenticação e redirecionar
 */
export async function redirectAfterLogin(role: string) {
  switch (role) {
    case 'DEVELOPER':
      redirect('/developer')
    case 'ADMIN':
      redirect('/admin')
    case 'PARCEIRO':
      redirect('/parceiro')
    case 'ASSINANTE':
      redirect('/app')
    default:
      redirect('/login')
  }
}

