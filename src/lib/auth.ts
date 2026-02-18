import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import prisma from './prisma'
import { logger } from './logger'

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
        logger.debug('========== [AUTH] INÍCIO AUTHORIZE ==========')
        logger.debug('[AUTH] Credentials recebidas:', {
          email: credentials?.email,
          passwordLength: (credentials?.password as string)?.length
        })

        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) {
          logger.debug('[AUTH] ERRO: Credenciais faltando - email:', !!email, 'password:', !!password)
          return null
        }

        try {
          logger.debug('[AUTH] Buscando usuário no banco:', email)

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              assinante: true,
              parceiro: true,
              admin: true
            }
          })

          logger.debug('[AUTH] Usuário encontrado:', user ? {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            hasPassword: !!user.password
          } : 'NÃO ENCONTRADO')

          if (!user) {
            logger.debug('[AUTH] ERRO: Usuário não existe no banco')
            return null
          }

          if (!user.password) {
            logger.debug('[AUTH] ERRO: Usuário sem senha cadastrada')
            return null
          }

          logger.debug('[AUTH] Comparando senhas...')
          const isPasswordValid = await bcrypt.compare(password, user.password)
          logger.debug('[AUTH] Resultado bcrypt.compare:', isPasswordValid)

          if (!isPasswordValid) {
            logger.debug('[AUTH] ERRO: Senha incorreta para:', email)
            return null
          }

          if (!user.isActive) {
            logger.debug('[AUTH] ERRO: Usuário desativado:', email)
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

          logger.debug('[AUTH] LOGIN BEM-SUCEDIDO:', email, 'Role:', user.role)
          logger.debug('========== [AUTH] FIM AUTHORIZE ==========')

          // Atualizar último acesso (fire-and-forget)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          }).catch(() => { })


          return {
            id: user.id,
            email: user.email,
            name,
            role: user.role,
            avatar: user.avatar
          }
        } catch (error) {
          logger.error('[AUTH] ERRO CRÍTICO no authorize:', error)
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
