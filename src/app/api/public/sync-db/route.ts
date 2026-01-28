import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  try {
    // Verificar DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'NÃO DEFINIDA'
    const maskedUrl = dbUrl.includes('@') 
      ? '...' + dbUrl.split('@')[1]?.substring(0, 40) + '...'
      : 'URL inválida'

    // Testar conexão
    const prisma = new PrismaClient()
    
    // Verificar se a coluna existe
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assinantes' 
      AND column_name IN ('asaasPaymentId', 'asaasCustomerId', 'asaasSubscriptionId')
    ` as { column_name: string }[]

    const existingColumns = tableInfo.map((row) => row.column_name)
    const missingColumns = ['asaasPaymentId', 'asaasCustomerId', 'asaasSubscriptionId']
      .filter(col => !existingColumns.includes(col))

    if (missingColumns.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json({
        status: 'OK',
        message: 'Todas as colunas Asaas já existem!',
        database: maskedUrl,
        columns: existingColumns
      })
    }

    // Adicionar colunas faltantes
    for (const col of missingColumns) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "assinantes" 
          ADD COLUMN IF NOT EXISTS "${col}" TEXT
        `)
      } catch {
        // Ignorar se já existe
      }
    }

    // Adicionar índices se não existirem
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "assinantes_asaasCustomerId_idx" ON "assinantes"("asaasCustomerId")
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "assinantes_asaasPaymentId_idx" ON "assinantes"("asaasPaymentId")
      `)
    } catch {
      // Ignorar erros de índice
    }

    await prisma.$disconnect()

    return NextResponse.json({
      status: 'CORRIGIDO',
      message: 'Colunas Asaas adicionadas ao banco!',
      database: maskedUrl,
      addedColumns: missingColumns,
      instrucao: 'Agora tente acessar /api/public/test-auth novamente'
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'ERRO',
      error: String(error)
    }, { status: 500 })
  }
}
