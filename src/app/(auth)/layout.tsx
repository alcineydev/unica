import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autenticação | Unica',
  description: 'Faça login ou cadastre-se no Unica Clube de Benefícios',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md p-4">
        {children}
      </div>
    </div>
  )
}

