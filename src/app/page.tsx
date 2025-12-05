import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Users, Store, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Unica</span>
          </div>
          <Link href="/login">
            <Button>Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Unica Clube de{' '}
          <span className="text-primary">Benefícios</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          O clube de benefícios do Grupo Zan Norte. Descontos exclusivos, 
          cashback e muito mais para você e sua família.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cadastro">
            <Button size="lg" className="w-full sm:w-auto">
              Seja um Assinante
            </Button>
          </Link>
          <Link href="/cadastro?tipo=parceiro">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Seja um Parceiro
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Assinantes</CardTitle>
              <CardDescription>
                Acesse descontos exclusivos em diversos parceiros da sua cidade
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Store className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Parceiros</CardTitle>
              <CardDescription>
                Aumente suas vendas fazendo parte do maior clube de benefícios da região
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Benefícios</CardTitle>
              <CardDescription>
                Descontos, cashback, pontos e acessos exclusivos em um só lugar
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Sistema seguro com QR Code individual para usar seus benefícios
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Unica Clube de Benefícios - Grupo Zan Norte</p>
          <p className="text-sm mt-1">Sinop e região - Mato Grosso</p>
        </div>
      </footer>
    </div>
  )
}
