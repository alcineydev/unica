import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Faça login ou cadastre-se no Unica Clube de Benefícios',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
