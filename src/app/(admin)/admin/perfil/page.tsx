import { redirect } from 'next/navigation'

export default function PerfilRedirect() {
  redirect('/admin/configuracoes?tab=perfil')
}
