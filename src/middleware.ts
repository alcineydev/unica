import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Rotas que o middleware deve verificar
  // Exclui arquivos estáticos, imagens, favicon, rotas públicas, etc.
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - api/public (public API routes)
     * - api/checkout (checkout API)
     * - api/webhooks (webhook routes)
     * - planos (public plans page)
     * - checkout (checkout pages)
     * - termos, privacidade, aviso-legal (legal pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!api/auth|api/public|api/checkout|api/webhooks|api/manifest|sw\\.js|planos|checkout|termos|privacidade|aviso-legal|recuperar-senha|redefinir-senha|_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

