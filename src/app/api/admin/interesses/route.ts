import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where = status && status !== 'all' ? { status } : {}
    
    const interesses = await prisma.interesseParceiro.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    
    // Estatísticas
    const stats = {
      total: await prisma.interesseParceiro.count(),
      pendentes: await prisma.interesseParceiro.count({ where: { status: 'PENDENTE' } }),
      contatados: await prisma.interesseParceiro.count({ where: { status: 'CONTATADO' } }),
      convertidos: await prisma.interesseParceiro.count({ where: { status: 'CONVERTIDO' } })
    }
    
    return NextResponse.json({ interesses, stats })
    
  } catch (error) {
    console.error('Erro ao buscar interesses:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar interesses' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, status, observacoes } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }
    
    const interesse = await prisma.interesseParceiro.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(observacoes !== undefined && { observacoes })
      }
    })
    
    return NextResponse.json({ interesse })
    
  } catch (error) {
    console.error('Erro ao atualizar interesse:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar interesse' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }
    
    await prisma.interesseParceiro.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro ao deletar interesse:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar interesse' },
      { status: 500 }
    )
  }
}

