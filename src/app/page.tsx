import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Sparkles, 
  Users, 
  Store, 
  Shield, 
  QrCode, 
  Percent, 
  RefreshCcw,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">Unica</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button>Cadastre-se</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Grupo Zan Norte apresenta
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              O clube de benefícios que{' '}
              <span className="text-primary">transforma</span> sua forma de economizar
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descontos exclusivos, cashback em todas as compras, pontos que viram dinheiro 
              e acesso a parceiros premium na sua cidade.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cadastro">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cadastro?tipo=parceiro">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Seja um parceiro
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 max-w-lg mx-auto">
              <div>
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Parceiros</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">10k+</p>
                <p className="text-sm text-muted-foreground">Assinantes</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">30%</p>
                <p className="text-sm text-muted-foreground">Economia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em apenas 3 passos você começa a economizar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Cadastre-se</h3>
              <p className="text-muted-foreground">
                Crie sua conta gratuitamente e escolha o plano ideal para você
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold">Use seu QR Code</h3>
              <p className="text-muted-foreground">
                Apresente seu QR Code exclusivo nos parceiros e aproveite os benefícios
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold">Economize</h3>
              <p className="text-muted-foreground">
                Ganhe descontos, acumule cashback e use seus pontos como dinheiro
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Benefícios exclusivos</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aproveite todas as vantagens de ser um assinante Unica
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Percent className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Descontos</CardTitle>
                <CardDescription>
                  Até 30% de desconto em centenas de parceiros da sua cidade
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <RefreshCcw className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Cashback</CardTitle>
                <CardDescription>
                  Receba parte do valor de volta em todas as suas compras
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <QrCode className="h-10 w-10 text-primary mb-2" />
                <CardTitle>QR Code único</CardTitle>
                <CardDescription>
                  Seu identificador pessoal para usar os benefícios rapidamente
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Sistema seguro e protegido para todas as suas transações
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Para quem */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Para Assinantes</h2>
              <ul className="space-y-4">
                {[
                  'Descontos exclusivos em parceiros locais',
                  'Cashback em todas as compras',
                  'Pontos que viram dinheiro de verdade',
                  'QR Code pessoal para facilitar o uso',
                  'Acesso a promoções exclusivas',
                  'App fácil e intuitivo',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="mt-8 inline-block">
                <Button size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  Seja um assinante
                </Button>
              </Link>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">Para Parceiros</h2>
              <ul className="space-y-4">
                {[
                  'Aumente o fluxo de clientes',
                  'Sistema de fidelização integrado',
                  'Dashboard com métricas em tempo real',
                  'Receba por vendas automaticamente',
                  'Marketing direcionado para assinantes',
                  'Suporte dedicado',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/cadastro?tipo=parceiro" className="mt-8 inline-block">
                <Button size="lg" variant="outline">
                  <Store className="mr-2 h-4 w-4" />
                  Seja um parceiro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para começar a economizar?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já estão aproveitando os benefícios do clube Unica.
            </p>
            <Link href="/cadastro">
              <Button size="lg" variant="secondary" className="gap-2">
                Criar minha conta grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold">Unica Clube de Benefícios</span>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Unica - Grupo Zan Norte. Todos os direitos reservados.
            </p>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/termos" className="hover:text-foreground">Termos</Link>
              <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
              <Link href="/contato" className="hover:text-foreground">Contato</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
