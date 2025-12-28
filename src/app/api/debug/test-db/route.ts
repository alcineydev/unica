import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'iniciando'
  }

  try {
    // Teste 1: Conexão básica
    results.step1_conexao = 'testando...'
    const userCount = await prisma.user.count()
    results.step1_conexao = `OK - ${userCount} usuários`

    // Teste 2: Contar categorias
    results.step2_categorias_count = 'testando...'
    const categoryCount = await prisma.category.count()
    results.step2_categorias_count = `OK - ${categoryCount} categorias`

    // Teste 3: Listar categorias com detalhes
    results.step3_categorias_lista = 'testando...'
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        banner: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })
    results.step3_categorias_lista = categories

    // Teste 4: Contar parceiros
    results.step4_parceiros_count = 'testando...'
    const parceiroCount = await prisma.parceiro.count()
    results.step4_parceiros_count = `OK - ${parceiroCount} parceiros`

    // Teste 5: Parceiros por categoria
    results.step5_parceiros_por_categoria = 'testando...'
    const parceirosPorCategoria = await prisma.parceiro.groupBy({
      by: ['categoryId'],
      _count: { id: true }
    })
    results.step5_parceiros_por_categoria = parceirosPorCategoria

    // Teste 6: Verificar assinantes
    results.step6_assinantes_count = 'testando...'
    const assinanteCount = await prisma.assinante.count()
    results.step6_assinantes_count = `OK - ${assinanteCount} assinantes`

    results.status = 'OK'
    return NextResponse.json(results)

  } catch (error: any) {
    results.status = 'ERRO'
    results.error = {
      message: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }
    return NextResponse.json(results, { status: 500 })
  }
}
