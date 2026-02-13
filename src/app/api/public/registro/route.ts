import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import { registerRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const registroSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  dataNascimento: z.string().optional().nullable(),
  endereco: z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional()
  }).optional().nullable()
})

export async function POST(request: NextRequest) {
  // Rate limiting - 3 registros por minuto por IP
  const ip = getClientIP(request)
  const { success } = await registerRateLimit(ip)
  if (!success) {
    logger.warn('[REGISTRO] Rate limit excedido para IP:', ip)
    return rateLimitResponse()
  }

  try {
    const body = await request.json()

    // Validar dados
    const validatedData = registroSchema.parse(body)
    
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado.' },
        { status: 400 }
      )
    }

    // Verificar se CPF já existe
    const existingCpf = await prisma.assinante.findFirst({
      where: { cpf: validatedData.cpf }
    })

    if (existingCpf) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado.' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)
    
    // Gerar QR Code único
    const qrCode = crypto.randomUUID()
    
    // Criar usuário e assinante em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar User
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'ASSINANTE',
          phone: validatedData.phone || null,
          isActive: true
        }
      })
      
      // Criar Assinante
      const assinante = await tx.assinante.create({
        data: {
          userId: user.id,
          name: validatedData.name,
          cpf: validatedData.cpf,
          phone: validatedData.phone || null,
          birthDate: validatedData.dataNascimento ? new Date(validatedData.dataNascimento) : null,
          address: validatedData.endereco || undefined,
          qrCode,
          subscriptionStatus: 'PENDING',
          points: 0,
          cashback: 0
        }
      })
      
      return { user, assinante }
    })

    // === PUSH NOTIFICATION PARA ADMINS: Novo Registro Público ===
    try {
      const { sendPushToAdmins } = await import('@/lib/push-notifications')
      await sendPushToAdmins(
        '🆕 Novo Cadastro Público',
        `${validatedData.name} se cadastrou pelo site`,
        '/admin/assinantes',
        'NEW_SUBSCRIBER'
      )
    } catch (pushError) {
      logger.warn('[REGISTRO] Push não enviado:', pushError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      userId: result.user.id
    })
    
  } catch (error) {
    logger.error('Erro ao registrar usuário:', error)
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return NextResponse.json(
        { error: zodError.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    )
  }
}

