import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Unica',
}

export default function LoginPage() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="text-muted-foreground mt-2">
        Página de login será implementada na fase de autenticação
      </p>
    </div>
  )
}

