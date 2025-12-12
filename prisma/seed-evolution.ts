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

  // ========================================
  // MERCADO PAGO
  // ========================================
  console.log('\n🌱 Criando configs do Mercado Pago...\n')

  // Config: Modo do Mercado Pago
  await prisma.config.upsert({
    where: { key: 'mercadopago_mode' },
    update: {},
    create: {
      key: 'mercadopago_mode',
      value: 'sandbox',
      description: 'Modo do Mercado Pago (sandbox ou production)',
      category: 'INTEGRATION',
    },
  })
  console.log('   ✅ Config mercadopago_mode criada')

  // Config: Public Key do Mercado Pago
  await prisma.config.upsert({
    where: { key: 'mercadopago_public_key' },
    update: {},
    create: {
      key: 'mercadopago_public_key',
      value: '',
      description: 'Public Key do Mercado Pago',
      category: 'INTEGRATION',
    },
  })
  console.log('   ✅ Config mercadopago_public_key criada')

  // Config: Access Token do Mercado Pago
  await prisma.config.upsert({
    where: { key: 'mercadopago_access_token' },
    update: {},
    create: {
      key: 'mercadopago_access_token',
      value: '',
      description: 'Access Token do Mercado Pago',
      category: 'INTEGRATION',
    },
  })
  console.log('   ✅ Config mercadopago_access_token criada')

  // Config: Webhook URL do Mercado Pago
  await prisma.config.upsert({
    where: { key: 'mercadopago_webhook_url' },
    update: {},
    create: {
      key: 'mercadopago_webhook_url',
      value: '',
      description: 'Webhook URL do Mercado Pago',
      category: 'INTEGRATION',
    },
  })
  console.log('   ✅ Config mercadopago_webhook_url criada')

  console.log('\n🎉 Todas as configs criadas com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

