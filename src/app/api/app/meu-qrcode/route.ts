import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinante
    let assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id },
      include: { 
        user: true,
        plan: true 
      }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Gerar qrCode se não existir
    if (!assinante.qrCode) {
      const qrCode = `UNICA-${assinante.id}-${randomUUID().slice(0, 8).toUpperCase()}`
      
      assinante = await prisma.assinante.update({
        where: { id: assinante.id },
        data: { qrCode },
        include: { 
          user: true,
          plan: true 
        }
      })
    }

    return NextResponse.json({
      qrCode: assinante.qrCode,
      assinante: {
        id: assinante.id,
        nome: assinante.user?.name || assinante.name,
        plano: assinante.plan?.name || 'Sem plano',
        status: assinante.subscriptionStatus
      }
    })

  } catch (error) {
    console.error('[MEU-QRCODE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao gerar QR Code' }, { status: 500 })
  }
}

