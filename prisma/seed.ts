import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // =============================================
  // 1. CRIAR CIDADES
  // =============================================
  console.log('📍 Criando cidades...')

  const sinop = await prisma.city.upsert({
    where: { name: 'Sinop' },
    update: {},
    create: {
      name: 'Sinop',
      state: 'MT',
      isActive: true,
    },
  })

  const claudia = await prisma.city.upsert({
    where: { name: 'Cláudia' },
    update: {},
    create: {
      name: 'Cláudia',
      state: 'MT',
      isActive: true,
    },
  })

  console.log(`   ✅ Cidade criada: ${sinop.name} - ${sinop.state}`)
  console.log(`   ✅ Cidade criada: ${claudia.name} - ${claudia.state}`)

  // =============================================
  // 2. CRIAR DEVELOPER (SUPER ADMIN)
  // =============================================
  console.log('\n👨‍💻 Criando Developer...')

  const developerPassword = await bcrypt.hash('dev123456', 12)

  const developer = await prisma.user.upsert({
    where: { email: 'developer@unica.com.br' },
    update: {},
    create: {
      email: 'developer@unica.com.br',
      password: developerPassword,
      role: 'DEVELOPER',
      isActive: true,
    },
  })

  console.log(`   ✅ Developer criado: ${developer.email}`)
  console.log(`   🔑 Senha: dev123456`)

  // =============================================
  // 3. CRIAR ADMIN
  // =============================================
  console.log('\n🔧 Criando Admin...')

  const adminPassword = await bcrypt.hash('admin123456', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@unica.com.br' },
    update: {},
    create: {
      email: 'admin@unica.com.br',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      admin: {
        create: {
          name: 'Administrador Unica',
          phone: '66999999999',
          permissions: {
            cities: true,
            benefits: true,
            plans: true,
            partners: true,
            subscribers: true,
            integrations: true,
            reports: true,
          },
        },
      },
    },
    include: {
      admin: true,
    },
  })

  console.log(`   ✅ Admin criado: ${adminUser.email}`)
  console.log(`   🔑 Senha: admin123456`)

  // =============================================
  // 4. CRIAR BENEFÍCIOS
  // =============================================
  console.log('\n🎁 Criando benefícios...')

  const beneficios = [
    {
      name: 'Desconto em Alimentação',
      description: 'Desconto de 10% em estabelecimentos de alimentação',
      type: 'DESCONTO' as const,
      value: { percentage: 10, category: 'alimentacao' },
      category: 'alimentacao',
    },
    {
      name: 'Desconto em Saúde',
      description: 'Desconto de 15% em clínicas e consultórios',
      type: 'DESCONTO' as const,
      value: { percentage: 15, category: 'saude' },
      category: 'saude',
    },
    {
      name: 'Desconto em Beleza',
      description: 'Desconto de 20% em salões e estéticas',
      type: 'DESCONTO' as const,
      value: { percentage: 20, category: 'beleza' },
      category: 'beleza',
    },
    {
      name: 'Cashback 3%',
      description: 'Cashback de 3% em todas as compras',
      type: 'CASHBACK' as const,
      value: { percentage: 3 },
      category: null,
    },
    {
      name: 'Cashback 5%',
      description: 'Cashback de 5% em todas as compras',
      type: 'CASHBACK' as const,
      value: { percentage: 5 },
      category: null,
    },
    {
      name: '50 Pontos Mensais',
      description: 'Receba 50 pontos todo mês',
      type: 'PONTOS' as const,
      value: { monthlyPoints: 50 },
      category: null,
    },
    {
      name: '100 Pontos Mensais',
      description: 'Receba 100 pontos todo mês',
      type: 'PONTOS' as const,
      value: { monthlyPoints: 100 },
      category: null,
    },
    {
      name: '200 Pontos Mensais',
      description: 'Receba 200 pontos todo mês',
      type: 'PONTOS' as const,
      value: { monthlyPoints: 200 },
      category: null,
    },
    {
      name: 'Acesso Premium',
      description: 'Acesso a parceiros exclusivos premium',
      type: 'ACESSO_EXCLUSIVO' as const,
      value: { tier: 'premium' },
      category: null,
    },
  ]

  const createdBenefits = []
  for (const beneficio of beneficios) {
    const benefit = await prisma.benefit.upsert({
      where: {
        id: beneficio.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      },
      update: {},
      create: beneficio,
    })
    createdBenefits.push(benefit)
    console.log(`   ✅ Benefício criado: ${benefit.name}`)
  }

  // =============================================
  // 5. CRIAR PLANOS
  // =============================================
  console.log('\n📋 Criando planos...')

  // Plano Básico
  const planoBasico = await prisma.plan.upsert({
    where: { id: 'plano-basico' },
    update: {
      slug: 'basico',
      priceMonthly: 19.90,
    },
    create: {
      id: 'plano-basico',
      name: 'Básico',
      slug: 'basico',
      description: 'Plano básico com descontos em alimentação e 50 pontos mensais',
      price: 19.90,
      priceMonthly: 19.90,
      isActive: true,
    },
  })

  // Associar benefícios ao plano básico
  const basicBenefits = createdBenefits.filter(b =>
    b.name === 'Desconto em Alimentação' ||
    b.name === '50 Pontos Mensais'
  )
  for (const benefit of basicBenefits) {
    await prisma.planBenefit.upsert({
      where: { planId_benefitId: { planId: planoBasico.id, benefitId: benefit.id } },
      update: {},
      create: {
        planId: planoBasico.id,
        benefitId: benefit.id,
      },
    })
  }
  console.log(`   ✅ Plano criado: ${planoBasico.name} - R$ ${planoBasico.price}`)

  // Plano Plus
  const planoPlus = await prisma.plan.upsert({
    where: { id: 'plano-plus' },
    update: {
      slug: 'plus',
      priceMonthly: 39.90,
    },
    create: {
      id: 'plano-plus',
      name: 'Plus',
      slug: 'plus',
      description: 'Plano intermediário com descontos, cashback 3% e 100 pontos mensais',
      price: 39.90,
      priceMonthly: 39.90,
      isActive: true,
    },
  })

  // Associar benefícios ao plano plus
  const plusBenefits = createdBenefits.filter(b =>
    b.name === 'Desconto em Alimentação' ||
    b.name === 'Desconto em Saúde' ||
    b.name === 'Cashback 3%' ||
    b.name === '100 Pontos Mensais'
  )
  for (const benefit of plusBenefits) {
    await prisma.planBenefit.upsert({
      where: { planId_benefitId: { planId: planoPlus.id, benefitId: benefit.id } },
      update: {},
      create: {
        planId: planoPlus.id,
        benefitId: benefit.id,
      },
    })
  }
  console.log(`   ✅ Plano criado: ${planoPlus.name} - R$ ${planoPlus.price}`)

  // Plano Premium
  const planoPremium = await prisma.plan.upsert({
    where: { id: 'plano-premium' },
    update: {
      slug: 'premium',
      priceMonthly: 69.90,
    },
    create: {
      id: 'plano-premium',
      name: 'Premium',
      slug: 'premium',
      description: 'Plano completo com todos os descontos, cashback 5%, 200 pontos e acesso premium',
      price: 69.90,
      priceMonthly: 69.90,
      isActive: true,
    },
  })

  // Associar benefícios ao plano premium
  const premiumBenefits = createdBenefits.filter(b =>
    b.name === 'Desconto em Alimentação' ||
    b.name === 'Desconto em Saúde' ||
    b.name === 'Desconto em Beleza' ||
    b.name === 'Cashback 5%' ||
    b.name === '200 Pontos Mensais' ||
    b.name === 'Acesso Premium'
  )
  for (const benefit of premiumBenefits) {
    await prisma.planBenefit.upsert({
      where: { planId_benefitId: { planId: planoPremium.id, benefitId: benefit.id } },
      update: {},
      create: {
        planId: planoPremium.id,
        benefitId: benefit.id,
      },
    })
  }
  console.log(`   ✅ Plano criado: ${planoPremium.name} - R$ ${planoPremium.price}`)

  // =============================================
  // 6. CRIAR CONFIGURAÇÕES INICIAIS
  // =============================================
  console.log('\n⚙️ Criando configurações...')

  const configs = [
    {
      key: 'points_value',
      value: '1.00',
      description: 'Valor de 1 ponto em reais',
      category: 'BUSINESS' as const,
    },
    {
      key: 'min_purchase',
      value: '1.00',
      description: 'Valor mínimo de compra',
      category: 'BUSINESS' as const,
    },
    {
      key: 'app_name',
      value: 'Unica Clube de Benefícios',
      description: 'Nome do aplicativo',
      category: 'SYSTEM' as const,
    },
    {
      key: 'company_name',
      value: 'Grupo Zan Norte',
      description: 'Nome da empresa',
      category: 'SYSTEM' as const,
    },
  ]

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
    console.log(`   ✅ Config criada: ${config.key} = ${config.value}`)
  }

  // =============================================
  // 7. CRIAR PÁGINAS LEGAIS
  // =============================================
  console.log('\n📄 Criando páginas legais...')

  const legalPages = [
    {
      slug: 'termos-e-condicoes',
      title: 'Termos e Condições',
      content: `<h1>Termos e Condições de Uso</h1>
<p><strong>Última atualização:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<h2>1. Aceitação dos Termos</h2>
<p>Ao acessar e utilizar os serviços do UNICA Clube de Benefícios, você concorda com estes Termos e Condições.</p>
<h2>2. Descrição do Serviço</h2>
<p>O UNICA Clube de Benefícios é uma plataforma de assinaturas que oferece benefícios e descontos exclusivos.</p>
<h2>3. Cadastro e Conta</h2>
<p>Para utilizar nossos serviços, é necessário criar uma conta com informações verdadeiras.</p>
<h2>4. Planos e Pagamentos</h2>
<p>Os planos são cobrados de forma recorrente. O cancelamento pode ser feito a qualquer momento.</p>
<p><em>Edite este conteúdo no painel administrativo.</em></p>`,
    },
    {
      slug: 'politica-de-privacidade',
      title: 'Política de Privacidade',
      content: `<h1>Política de Privacidade</h1>
<p><strong>Última atualização:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<h2>1. Informações que Coletamos</h2>
<p>Coletamos informações pessoais como nome, e-mail, CPF, telefone e dados de pagamento.</p>
<h2>2. Uso das Informações</h2>
<p>Suas informações são utilizadas para gerenciar sua conta e processar pagamentos.</p>
<h2>3. Proteção de Dados (LGPD)</h2>
<p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
<h2>4. Seus Direitos</h2>
<p>Você pode acessar, corrigir ou excluir seus dados a qualquer momento.</p>
<p><em>Edite este conteúdo no painel administrativo.</em></p>`,
    },
    {
      slug: 'aviso-legal',
      title: 'Aviso Legal',
      content: `<h1>Aviso Legal</h1>
<p><strong>Última atualização:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
<h2>1. Identificação</h2>
<p>Este site é operado pelo UNICA Clube de Benefícios.</p>
<h2>2. Limitação de Responsabilidade</h2>
<p>Não garantimos disponibilidade ininterrupta dos serviços.</p>
<h2>3. Propriedade Intelectual</h2>
<p>Todo o conteúdo deste site é de nossa propriedade.</p>
<p><em>Edite este conteúdo no painel administrativo.</em></p>`,
    },
  ]

  for (const page of legalPages) {
    await prisma.legalPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    })
    console.log(`   ✅ Página legal criada: ${page.title}`)
  }

  // =============================================
  // RESUMO
  // =============================================
  console.log('\n' + '='.repeat(50))
  console.log('🎉 SEED CONCLUÍDO COM SUCESSO!')
  console.log('='.repeat(50))
  console.log('\n📊 Resumo:')
  console.log(`   • ${2} cidades criadas`)
  console.log(`   • ${1} developer criado`)
  console.log(`   • ${1} admin criado`)
  console.log(`   • ${beneficios.length} benefícios criados`)
  console.log(`   • ${3} planos criados`)
  console.log(`   • ${configs.length} configurações criadas`)
  console.log(`   • ${3} páginas legais criadas`)
  console.log('\n🔐 Credenciais de acesso:')
  console.log('   Developer: developer@unica.com.br / dev123456')
  console.log('   Admin: admin@unica.com.br / admin123456')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
