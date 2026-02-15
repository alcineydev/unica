import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Migrando cashback para modelo por parceiro...')

  // 1. Buscar todas as transações com cashback gerado
  const transactions = await prisma.transaction.findMany({
    where: {
      parceiroId: { not: null },
      cashbackGenerated: { gt: 0 },
      status: 'COMPLETED',
    },
    select: {
      assinanteId: true,
      parceiroId: true,
      cashbackGenerated: true,
    },
  })

  console.log(`Encontradas ${transactions.length} transações com cashback`)

  // 2. Agrupar por assinante+parceiro
  const balances = new Map<string, { assinanteId: string; parceiroId: string; total: number }>()

  for (const t of transactions) {
    if (!t.parceiroId) continue
    const key = `${t.assinanteId}_${t.parceiroId}`
    const existing = balances.get(key)
    if (existing) {
      existing.total += Number(t.cashbackGenerated)
    } else {
      balances.set(key, {
        assinanteId: t.assinanteId,
        parceiroId: t.parceiroId,
        total: Number(t.cashbackGenerated),
      })
    }
  }

  console.log(`${balances.size} pares assinante+parceiro para migrar`)

  // 3. Criar CashbackBalance para cada par
  let created = 0
  let updated = 0

  for (const [, data] of balances) {
    const result = await prisma.cashbackBalance.upsert({
      where: {
        assinanteId_parceiroId: {
          assinanteId: data.assinanteId,
          parceiroId: data.parceiroId,
        },
      },
      update: {
        balance: data.total,
        totalEarned: data.total,
        totalUsed: 0,
      },
      create: {
        assinanteId: data.assinanteId,
        parceiroId: data.parceiroId,
        balance: data.total,
        totalEarned: data.total,
        totalUsed: 0,
      },
    })

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++
    } else {
      updated++
    }
  }

  console.log(`✅ Criados: ${created} | Atualizados: ${updated}`)

  // 4. Verificação
  const totalBalances = await prisma.cashbackBalance.count()
  const totalAmount = await prisma.cashbackBalance.aggregate({
    _sum: { balance: true },
  })

  console.log(`\n📊 Resumo:`)
  console.log(`  Total registros: ${totalBalances}`)
  console.log(`  Total cashback: R$ ${Number(totalAmount._sum.balance || 0).toFixed(2)}`)
  console.log('\n✅ Migração concluída!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
