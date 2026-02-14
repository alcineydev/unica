import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migração GUEST → Plano Convite...\n')

  // 1. Buscar TODOS os benefícios existentes
  const allBenefits = await prisma.benefit.findMany({
    select: { id: true, name: true }
  })

  console.log(`📦 Encontrados ${allBenefits.length} benefícios`)

  // 2. Criar plano Convite (ou atualizar se já existe)
  const convitePlan = await prisma.plan.upsert({
    where: { slug: 'convite' },
    update: {
      name: 'Convite',
      description: 'Plano convidado — acesso total a todos os benefícios',
      price: 0,
      priceMonthly: 0,
      priceSingle: 0,
      priceYearly: 0,
      isActive: true,
      features: ['Acesso total', 'Todos os parceiros', 'Todos os benefícios', 'Sem cobrança'],
    },
    create: {
      name: 'Convite',
      slug: 'convite',
      description: 'Plano convidado — acesso total a todos os benefícios',
      price: 0,
      priceMonthly: 0,
      priceSingle: 0,
      priceYearly: 0,
      isActive: true,
      features: ['Acesso total', 'Todos os parceiros', 'Todos os benefícios', 'Sem cobrança'],
    },
  })

  console.log(`✅ Plano Convite criado/atualizado: ${convitePlan.id}`)

  // 3. Vincular TODOS os benefícios ao plano Convite
  let vinculados = 0
  for (const benefit of allBenefits) {
    await prisma.planBenefit.upsert({
      where: {
        planId_benefitId: {
          planId: convitePlan.id,
          benefitId: benefit.id,
        },
      },
      update: {},
      create: {
        planId: convitePlan.id,
        benefitId: benefit.id,
      },
    })
    vinculados++
  }

  console.log(`🔗 ${vinculados} benefícios vinculados ao plano Convite`)

  // 4. Migrar assinantes com status GUEST para plano Convite + status ACTIVE
  const guestAssinantes = await prisma.assinante.findMany({
    where: { subscriptionStatus: 'GUEST' },
    select: { id: true, name: true }
  })

  console.log(`\n👥 Encontrados ${guestAssinantes.length} assinantes GUEST para migrar`)

  for (const assinante of guestAssinantes) {
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        planId: convitePlan.id,
        subscriptionStatus: 'ACTIVE',
      },
    })
    console.log(`   ✅ Migrado: ${assinante.name}`)
  }

  console.log('\n🎉 Migração concluída!')
  console.log(`   Plano Convite: ${convitePlan.id} (slug: convite)`)
  console.log(`   Benefícios vinculados: ${vinculados}`)
  console.log(`   Assinantes migrados: ${guestAssinantes.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
