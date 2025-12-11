import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Contar destinatários
export async function GET(request: Request) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const targetType = searchParams.get('targetType')
  const targetPlanId = searchParams.get('targetPlanId')
  const targetCityId = searchParams.get('targetCityId')

  try {
    let count = 0

    switch (targetType) {
      case 'TODOS':
        const [assinantesCount, parceirosCount] = await Promise.all([
          prisma.assinante.count({
            where: {
              user: { isActive: true },
              phone: { not: '' },
            }
          }),
          prisma.parceiro.count({
            where: {
              user: { isActive: true },
              isActive: true,
            }
          }),
        ])
        count = assinantesCount + parceirosCount
        break

      case 'ALL_ASSINANTES':
        count = await prisma.assinante.count({
          where: {
            user: { isActive: true },
            phone: { not: '' },
          }
        })
        break

      case 'PLANO_ESPECIFICO':
        if (targetPlanId) {
          count = await prisma.assinante.count({
            where: {
              planId: targetPlanId,
              user: { isActive: true },
              phone: { not: '' },
            }
          })
        }
        break

      case 'ALL_PARCEIROS':
        count = await prisma.parceiro.count({
          where: {
            user: { isActive: true },
            isActive: true,
          }
        })
        break

      case 'PARCEIROS_CIDADE':
        if (targetCityId) {
          count = await prisma.parceiro.count({
            where: {
              cityId: targetCityId,
              user: { isActive: true },
              isActive: true,
            }
          })
        }
        break
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Erro ao contar destinatários:', error)
    return NextResponse.json({ error: 'Erro ao contar destinatários' }, { status: 500 })
  }
}

