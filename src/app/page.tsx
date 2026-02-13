import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Gift,
  Shield,
  Percent,
  QrCode,
  ArrowRight,
  Star,
  Users,
  Store,
  ChevronRight,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">UNICA</span>
            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
              Clube de Beneficios
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/planos">
                Ver Planos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6" variant="secondary">
              <Star className="h-3 w-3 mr-1" />
              Sinop e Claudia - MT
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Economize em tudo com o{' '}
              <span className="text-primary">UNICA</span>{' '}
              Clube de Beneficios
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Descontos exclusivos, cashback e pontos em centenas de parceiros
              da sua cidade. Tudo em um unico lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/planos">
                  Ver Planos e Precos
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/cadastro">
                  Criar Conta Gratis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Como funciona?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simples, rapido e com economia real no seu dia a dia
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Escolha seu plano',
                description: 'Selecione o plano ideal para voce e sua familia',
                color: 'bg-blue-100 text-blue-600',
              },
              {
                icon: QrCode,
                title: 'Receba seu QR Code',
                description: 'Seu QR Code exclusivo para identificacao nos parceiros',
                color: 'bg-purple-100 text-purple-600',
              },
              {
                icon: Store,
                title: 'Use nos parceiros',
                description: 'Apresente seu QR Code e aproveite descontos exclusivos',
                color: 'bg-green-100 text-green-600',
              },
              {
                icon: Percent,
                title: 'Economize sempre',
                description: 'Cashback, pontos e descontos em todas as compras',
                color: 'bg-amber-100 text-amber-600',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="bg-background rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-white">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Pronto para economizar?
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Junte-se a milhares de pessoas que ja economizam com o UNICA
              Clube de Beneficios.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/planos">
                Conhecer os Planos
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-8 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Pagamento seguro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-primary" />
              <span>PIX, Cartao e Boleto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Grupo Zan Norte</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UNICA Clube de Beneficios - Grupo Zan Norte</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">
              Aviso Legal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
