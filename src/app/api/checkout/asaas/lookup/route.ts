import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/checkout/asaas/lookup
 * Busca dados de um usuário pelo email para pré-preencher o checkout.
 * Retorna apenas dados básicos (nome, telefone, CPF, endereço) - sem dados sensíveis.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ found: false })
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
          }
        }
      }
    })

    if (!user?.assinante) {
      return NextResponse.json({ found: false })
    }

    const assinante = user.assinante
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = assinante.address as Record<string, any> | null

    return NextResponse.json({
      found: true,
      data: {
        name: assinante.name || '',
        phone: assinante.phone || user.phone || '',
        cpfCnpj: assinante.cpf || '',
        // Endereço (se existir no JSON)
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
    return NextResponse.json({ found: false })
  }
}
