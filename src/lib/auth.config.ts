import type { NextAuthConfig } from 'next-auth'

/**
 * Configuração base do NextAuth
 * Separada para uso no middleware (Edge Runtime)
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Rotas públicas
      const publicRoutes = ['/', '/login', '/cadastro']
      const isPublicRoute = publicRoutes.includes(pathname)

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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
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
  // Rotas do Developer
  if (pathname.startsWith('/developer')) {
    return role === 'DEVELOPER'
  }

  // Rotas do Admin
  if (pathname.startsWith('/admin')) {
    return role === 'ADMIN' || role === 'DEVELOPER'
  }

  // Rotas do Parceiro
  if (pathname.startsWith('/parceiro')) {
    return role === 'PARCEIRO'
  }

  // Rotas do App (Assinante)
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

