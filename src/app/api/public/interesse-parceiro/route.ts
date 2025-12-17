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
    
    console.log('[INTERESSE] Body recebido:', body)
    
    // Validar dados
    const validatedData = interesseSchema.parse(body)
    
    console.log('[INTERESSE] Dados validados:', validatedData)
    
    // Verificar se já existe interesse com este email
    const existente = await prisma.interesseParceiro.findFirst({
      where: { email: validatedData.email }
    })
    
    if (existente) {
      console.log('[INTERESSE] Email já existe:', validatedData.email)
      return NextResponse.json(
        { error: 'Já recebemos seu interesse! Entraremos em contato em breve.' },
        { status: 400 }
      )
    }
    
    // Criar registro
    const interesse = await prisma.interesseParceiro.create({
      data: validatedData
    })
    
    console.log('[INTERESSE] Criado com sucesso:', interesse.id)
    
    return NextResponse.json({
      success: true,
      message: 'Interesse registrado com sucesso! Entraremos em contato em breve.',
      id: interesse.id
    })
    
  } catch (error) {
    console.error('[INTERESSE] Erro:', error)
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      console.log('[INTERESSE] Erro de validação:', zodError.issues)
      return NextResponse.json(
        { error: zodError.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao registrar interesse. Tente novamente.' },
      { status: 500 }
    )
  }
}
