import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearSubscriptions() {
  console.log('🗑️  Limpando todas as push subscriptions...')

  const count = await prisma.pushSubscription.count()
  console.log(`Encontradas ${count} subscriptions`)

  if (count > 0) {
    await prisma.pushSubscription.deleteMany({})
    console.log(`✅ ${count} subscriptions removidas`)
  } else {
    console.log('Nenhuma subscription para remover')
  }

  await prisma.$disconnect()
}

clearSubscriptions()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
