import { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Faça login ou cadastre-se no Unica Clube de Benefícios',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado esquerdo - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-10 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          <span className="text-2xl font-bold">Unica</span>
        </Link>
        
        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Economize mais com descontos exclusivos, ganhe cashback em todas 
              as compras e aproveite benefícios únicos na sua cidade.&rdquo;
            </p>
            <footer className="text-sm opacity-80">
              Unica Clube de Benefícios - Grupo Zan Norte
            </footer>
          </blockquote>
          
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="opacity-80">Parceiros</p>
            </div>
            <div>
              <p className="text-3xl font-bold">10mil+</p>
              <p className="opacity-80">Assinantes</p>
            </div>
            <div>
              <p className="text-3xl font-bold">30%</p>
              <p className="opacity-80">Economia média</p>
            </div>
          </div>
        </div>

        <p className="text-sm opacity-60">
          © {new Date().getFullYear()} Unica - Todos os direitos reservados
        </p>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex items-center justify-center p-6 lg:p-10 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Sparkles className="h-10 w-10" />
              <span className="text-3xl font-bold">Unica</span>
            </Link>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}

