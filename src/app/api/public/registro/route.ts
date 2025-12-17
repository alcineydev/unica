import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const registroSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export async function POST(request: NextRequest) {
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
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)
    
    // Gerar QR Code único
    const qrCode = uuidv4()
    
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
          phone: validatedData.phone || null,
          qrCode,
          subscriptionStatus: 'PENDING',
          points: 0,
          cashback: 0
        }
      })
      
      return { user, assinante }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      userId: result.user.id
    })
    
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    
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

