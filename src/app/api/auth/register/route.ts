import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// Schema de validação
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  // Remover caracteres não numéricos
  cpf = cpf.replace(/\D/g, '')

  // Verificar se tem 11 dígitos
  if (cpf.length !== 11) return false

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false

  // Validar dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (digit !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (digit !== parseInt(cpf.charAt(10))) return false

  return true
}

// Função para gerar QR Code único
function generateQRCode(cpf: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `UNICA-${cpf.substring(0, 4)}-${timestamp}-${random}`.toUpperCase()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    logger.debug('[REGISTER] Dados recebidos:', { ...body, password: '***' })

    // Validar dados
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const { name, email, phone, cpf, password } = validationResult.data

    // Validar CPF
    if (!validateCPF(cpf)) {
      return NextResponse.json(
        { error: 'CPF inválido', field: 'cpf' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado', field: 'email' },
        { status: 400 }
      )
    }

    // Verificar se CPF já existe
    const existingCPF = await prisma.assinante.findUnique({
      where: { cpf },
    })
    if (existingCPF) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado', field: 'cpf' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Gerar QR Code único
    const qrCode = generateQRCode(cpf)

    // Criar User e Assinante em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ASSINANTE',
          isActive: true,
        },
      })

      // Criar Assinante (sem plano)
      const assinante = await tx.assinante.create({
        data: {
          userId: user.id,
          cpf,
          name,
          phone,
          qrCode,
          subscriptionStatus: 'PENDING',
          points: 0,
          cashback: 0,
          // planId, cityId, address são opcionais - serão preenchidos depois
        },
      })

      return { user, assinante }
    })

    logger.log('[REGISTER] Usuário criado:', result.user.id)
    logger.log('[REGISTER] Assinante criado:', result.assinante.id)

    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso',
      userId: result.user.id,
    })
  } catch (error) {
    console.error('[REGISTER] Erro:', error)
    
    // Tratar erros específicos do Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'Este e-mail já está cadastrado', field: 'email' },
            { status: 400 }
          )
        }
        if (error.message.includes('cpf')) {
          return NextResponse.json(
            { error: 'Este CPF já está cadastrado', field: 'cpf' },
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

