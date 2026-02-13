import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/checkout/asaas/lookup
 * Busca dados de um usuário pelo email para pré-preencher o checkout.
 * Retorna: exists, hasActivePlan, planName, found, data (prefill).
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ found: false, exists: false })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        phone: true,
        assinante: {
          select: {
            name: true,
            cpf: true,
            phone: true,
            address: true,
            subscriptionStatus: true,
            plan: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ found: false, exists: false })
    }

    // Usuário existe mas sem assinante
    if (!user.assinante) {
      return NextResponse.json({
        found: false,
        exists: true,
        hasActivePlan: false,
      })
    }

    const assinante = user.assinante
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = assinante.address as Record<string, any> | null

    // Verificar se tem plano ativo
    const hasActivePlan = assinante.subscriptionStatus === 'ACTIVE'
    const planName = assinante.plan?.name || undefined

    return NextResponse.json({
      found: true,
      exists: true,
      hasActivePlan,
      planName,
      data: {
        name: assinante.name || '',
        phone: assinante.phone || user.phone || '',
        cpfCnpj: assinante.cpf || '',
        cep: address?.cep || address?.postalCode || '',
        street: address?.logradouro || address?.street || address?.address || '',
        number: address?.numero || address?.number || address?.addressNumber || '',
        complement: address?.complemento || address?.complement || '',
        neighborhood: address?.bairro || address?.neighborhood || address?.province || '',
        city: address?.cidade || address?.city || '',
        state: address?.estado || address?.state || address?.uf || '',
      }
    })
  } catch (error) {
    console.error('[CHECKOUT LOOKUP] Erro:', error)
    return NextResponse.json({ found: false, exists: false })
  }
}
