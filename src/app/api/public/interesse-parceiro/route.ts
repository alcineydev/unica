import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const interesseSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  nomeEmpresa: z.string().min(2, 'Nome da empresa é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validatedData = interesseSchema.parse(body)
    
    // Verificar se já existe interesse com este email
    const existente = await prisma.interesseParceiro.findFirst({
      where: { email: validatedData.email }
    })
    
    if (existente) {
      return NextResponse.json(
        { error: 'Já recebemos seu interesse! Entraremos em contato em breve.' },
        { status: 400 }
      )
    }
    
    // Criar registro
    const interesse = await prisma.interesseParceiro.create({
      data: validatedData
    })
    
    return NextResponse.json({
      success: true,
      message: 'Interesse registrado com sucesso! Entraremos em contato em breve.',
      id: interesse.id
    })
    
  } catch (error) {
    console.error('Erro ao registrar interesse:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao registrar interesse. Tente novamente.' },
      { status: 500 }
    )
  }
}

