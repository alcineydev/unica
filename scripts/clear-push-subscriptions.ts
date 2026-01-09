/**
 * Script para limpar push subscriptions antigas
 *
 * Execute este script no ambiente de produção:
 *
 * Via Prisma Studio:
 * 1. npx prisma studio
 * 2. Navegue até "PushSubscription"
 * 3. Selecione todos os registros
 * 4. Delete
 *
 * Via SQL direto no banco:
 * DELETE FROM push_subscriptions;
 *
 * Via este script (se Prisma client estiver gerado):
 * npx tsx scripts/clear-push-subscriptions.ts
 */

import prisma from '../src/lib/prisma'

async function main() {
  console.log('Limpando push subscriptions antigas...')

  const count = await prisma.pushSubscription.count()
  console.log(`Encontradas ${count} subscriptions...`)

  if (count > 0) {
    const result = await prisma.pushSubscription.deleteMany({})
    console.log(`${result.count} subscriptions removidas.`)
  }

  console.log('Agora os usuários precisam permitir notificações novamente no novo domínio.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
