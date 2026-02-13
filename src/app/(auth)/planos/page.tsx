import { redirect } from 'next/navigation'

/**
 * Redireciona para a LP pública de planos.
 * A página principal de planos agora está em (public)/planos.
 */
export default function PlanosRedirectPage() {
  redirect('/planos')
}
