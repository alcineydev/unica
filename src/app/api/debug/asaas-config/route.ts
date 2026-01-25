import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Ver dados no banco
export async function GET() {
  try {
    // Buscar TODAS as configs que começam com asaas_
    const configs = await prisma.config.findMany({
      where: {
        key: {
          startsWith: 'asaas_'
        }
      }
    })

    // Buscar também sem filtro para ver se existe algo
    const allConfigs = await prisma.config.findMany({
      take: 20
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      asaasConfigs: configs.map(c => ({
        id: c.id,
        key: c.key,
        value: c.value ? `${c.value.substring(0, 20)}...` : 'NULL/EMPTY',
        valueLength: c.value?.length || 0,
        hasValue: !!c.value && c.value.length > 0
      })),
      totalAsaasConfigs: configs.length,
      sampleAllConfigs: allConfigs.slice(0, 5).map(c => ({
        id: c.id,
        key: c.key,
        hasValue: !!c.value
      })),
      totalAllConfigs: allConfigs.length
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST para testar salvamento
export async function POST() {
  try {
    const testKey = 'asaas_test_' + Date.now()
    const testValue = 'test_value_123'

    console.log('[DEBUG] Testando salvamento com key:', testKey)

    // Tentar criar
    const created = await prisma.config.create({
      data: {
        key: testKey,
        value: testValue,
        description: 'Teste de salvamento',
        category: 'INTEGRATION',
      }
    })

    console.log('[DEBUG] Criado:', created)

    // Buscar de volta
    const found = await prisma.config.findUnique({
      where: { key: testKey }
    })

    console.log('[DEBUG] Encontrado:', found)

    // Deletar o teste
    await prisma.config.delete({
      where: { key: testKey }
    })

    console.log('[DEBUG] Deletado')

    return NextResponse.json({
      created: !!created,
      createdId: created.id,
      found: !!found,
      valueMatches: found?.value === testValue,
      message: '✅ Teste de salvamento OK! O banco está funcionando corretamente.'
    })
  } catch (error) {
    console.error('[DEBUG] Erro:', error)
    return NextResponse.json({ 
      error: String(error),
      message: '❌ ERRO no teste de salvamento'
    }, { status: 500 })
  }
}

