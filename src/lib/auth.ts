import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './auth.config'
import prisma from './prisma'

// Schema de validação do login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        // Valida os dados de entrada
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          console.log('[AUTH] Validação falhou:', parsed.error.issues)
          return null
        }

        const { email, password } = parsed.data
        console.log('[AUTH] Tentativa de login:', email)

        try {
          // Busca o usuário no banco
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              admin: true,
              parceiro: true,
              assinante: true,
            },
          })

          console.log('[AUTH] Usuário encontrado:', !!user)

          if (!user) {
            console.log('[AUTH] Usuário não existe')
            return null
          }

          // Verifica a senha
          const passwordMatch = await bcrypt.compare(password, user.password)
          console.log('[AUTH] Senha válida:', passwordMatch)
          
          if (!passwordMatch) {
            console.log('[AUTH] Senha incorreta')
            return null
          }

          // Para outros roles (ADMIN, PARCEIRO, DEVELOPER): verifica isActive
          if (user.role !== 'ASSINANTE' && !user.isActive) {
            console.log('[AUTH] Usuário bloqueado (isActive=false)')
            throw new Error('Conta desativada. Entre em contato com o suporte.')
          }

          // Para ASSINANTE: verificar status da assinatura
          if (user.role === 'ASSINANTE') {
            if (!user.assinante) {
              console.log('[AUTH] Assinante não encontrado')
              throw new Error('Perfil de assinante não encontrado. Por favor, faça sua assinatura.')
            }
            
            if (user.assinante.status === 'CANCELLED') {
              console.log('[AUTH] Assinatura cancelada')
              throw new Error('Sua assinatura foi cancelada. Refaça sua assinatura para continuar.')
            }
            
            if (user.assinante.status === 'INACTIVE') {
              console.log('[AUTH] Assinatura inativa')
              throw new Error('Sua assinatura está inativa. Renove para continuar.')
            }
          }

          // Obtém o nome do perfil correspondente
          let name = 'Usuário'
          if (user.admin) {
            name = user.admin.name
          } else if (user.parceiro) {
            name = user.parceiro.companyName
          } else if (user.assinante) {
            name = user.assinante.name
          }

          console.log('[AUTH] Login bem sucedido:', { email, role: user.role, name })

          // Retorna os dados do usuário para o token
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            name,
            avatar: user.avatar,
          }
        } catch (error) {
          console.error('[AUTH] Erro na autenticação:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
})

/**
 * Função auxiliar para obter a sessão no servidor
 */
export async function getServerSession() {
  return await auth()
}

/**
 * Função auxiliar para verificar se o usuário tem uma role específica
 */
export async function hasRole(allowedRoles: string[]) {
  const session = await auth()
  if (!session?.user?.role) return false
  return allowedRoles.includes(session.user.role)
}

/**
 * Função auxiliar para hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Função auxiliar para verificar senha
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

