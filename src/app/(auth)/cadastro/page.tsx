import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cadastro | Unica',
}

export default function CadastroPage() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Cadastro</h1>
      <p className="text-muted-foreground mt-2">
        Página de cadastro será implementada na fase de autenticação
      </p>
    </div>
  )
}

