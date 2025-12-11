import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Criando configs da Evolution API...\n')

  // Config: URL da Evolution API
  await prisma.config.upsert({
    where: { key: 'evolution_api_url' },
    update: {},
    create: {
      key: 'evolution_api_url',
      value: 'https://api.guiasinop.com',
      description: 'URL da Evolution API',
      category: 'INTEGRATION',
    },
  })
  console.log('   ✅ Config evolution_api_url criada')

  // Config: API Key da Evolution API
  await prisma.config.upsert({
    where: { key: 'evolution_api_key' },
    update: {},
    create: {
      key: 'evolution_api_key',
      value: 'dde78d4cae90b5a03905d94e1f8e5fe4',
      description: 'API Key da Evolution API',
      category: 'INTEGRATION',
    },
  })
  console.log('   ✅ Config evolution_api_key criada')

  console.log('\n🎉 Configs da Evolution API criadas com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

