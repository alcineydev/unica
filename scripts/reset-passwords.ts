import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Resetando senhas dos usuários...\n')

  // Developer
  const devHash = await bcrypt.hash('dev123456', 10)
  const dev = await prisma.user.updateMany({
    where: { email: 'developer@unica.com.br' },
    data: { password: devHash }
  })
  console.log('Developer:', dev.count > 0 ? '✅ Senha atualizada' : '❌ Não encontrado')

  // Admin
  const adminHash = await bcrypt.hash('admin123456', 10)
  const admin = await prisma.user.updateMany({
    where: { email: 'admin@unica.com.br' },
    data: { password: adminHash }
  })
  console.log('Admin:', admin.count > 0 ? '✅ Senha atualizada' : '❌ Não encontrado')

  // Listar todos os usuários
  const users = await prisma.user.findMany({
    select: { email: true, role: true, isActive: true }
  })

  console.log('\n📋 Usuários no banco:')
  users.forEach(u => {
    console.log(`  - ${u.email} (${u.role}) - ${u.isActive ? 'Ativo' : 'Inativo'}`)
  })

  console.log('\n✅ Pronto! Credenciais:')
  console.log('  developer@unica.com.br / dev123456')
  console.log('  admin@unica.com.br / admin123456')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
