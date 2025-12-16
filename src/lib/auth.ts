import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import prisma from './prisma'

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
        // Verificar se credentials existe e tem os campos necessários
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) {
          console.log('[AUTH] Credenciais não fornecidas')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              assinante: true,
              parceiro: true,
              admin: true
            }
          })

          if (!user) {
            console.log('[AUTH] Usuário não encontrado:', email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(password, user.password)

          if (!isPasswordValid) {
            console.log('[AUTH] Senha incorreta para:', email)
            return null
          }

          if (!user.isActive) {
            console.log('[AUTH] Usuário desativado:', email)
            return null
          }

          // Obtém o nome do perfil correspondente
          let name = user.email
          if (user.admin) {
            name = user.admin.name
          } else if (user.parceiro) {
            name = user.parceiro.companyName
          } else if (user.assinante) {
            name = user.assinante.name
          }

          console.log('[AUTH] Login bem-sucedido:', email, 'Role:', user.role)

          return {
            id: user.id,
            email: user.email,
            name,
            role: user.role,
            avatar: user.avatar
          }
        } catch (error) {
          console.error('[AUTH] Erro no authorize:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  trustHost: true,
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

