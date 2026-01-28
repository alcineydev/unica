import type { NextAuthConfig } from 'next-auth'

/**
 * Configuração base do NextAuth
 * Separada para uso no middleware (Edge Runtime)
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Rotas públicas
      const publicRoutes = ['/', '/login', '/cadastro', '/interesse-parceiro', '/recuperar-senha', '/redefinir-senha']
      const publicPrefixes = ['/planos', '/checkout/', '/checkout', '/api/public', '/api/checkout', '/api/webhooks', '/api/manifest', '/api/auth', '/sw.js', '/icons/', '/recuperar-senha', '/redefinir-senha']
      
      const isPublicRoute = publicRoutes.includes(pathname) || 
        publicPrefixes.some(prefix => pathname.startsWith(prefix))

      // Se é rota pública, permite acesso
      if (isPublicRoute) {
        // Se já está logado e tenta acessar login/cadastro, redireciona
        if (isLoggedIn && (pathname === '/login' || pathname === '/cadastro')) {
          const role = auth.user.role
          const redirectUrl = getRedirectByRole(role)
          return Response.redirect(new URL(redirectUrl, nextUrl))
        }
        return true
      }

      // Se não está logado, redireciona para login
      if (!isLoggedIn) {
        return false // Redireciona para signIn page
      }

      // Verifica permissão por role
      const role = auth.user.role
      const hasAccess = checkRouteAccess(pathname, role)

      if (!hasAccess) {
        // Redireciona para a área correta do usuário
        const redirectUrl = getRedirectByRole(role)
        return Response.redirect(new URL(redirectUrl, nextUrl))
      }

      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.avatar = user.avatar
      }
      
      // Permitir atualização da sessão (para atualizar avatar/nome)
      if (trigger === 'update' && session) {
        if (session.user?.name) token.name = session.user.name
        if (session.user?.avatar !== undefined) token.avatar = session.user.avatar
      }
      
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
        session.user.avatar = token.avatar as string | null
      }
      return session
    },
  },
  providers: [], // Providers são adicionados em auth.ts
}

/**
 * Verifica se o usuário tem acesso à rota baseado no role
 */
function checkRouteAccess(pathname: string, role: string): boolean {
  // Rotas do Developer - apenas DEVELOPER
  if (pathname.startsWith('/developer')) {
    return role === 'DEVELOPER'
  }

  // Rotas do Admin - apenas ADMIN ou DEVELOPER
  if (pathname.startsWith('/admin')) {
    return role === 'ADMIN' || role === 'DEVELOPER'
  }

  // Rotas do Parceiro - apenas PARCEIRO
  if (pathname.startsWith('/parceiro')) {
    return role === 'PARCEIRO'
  }

  // Rotas do App (Assinante) - apenas ASSINANTE
  if (pathname.startsWith('/app')) {
    return role === 'ASSINANTE'
  }

  // API routes - verificação específica será feita em cada endpoint
  if (pathname.startsWith('/api')) {
    return true
  }

  return false
}

/**
 * Retorna a URL de redirecionamento baseada no role do usuário
 */
function getRedirectByRole(role: string): string {
  switch (role) {
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
}

