import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare } from 'bcryptjs'

export async function GET() {
  try {
    // Verificar variáveis de ambiente do NextAuth
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NÃO DEFINIDA',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINIDA (' + process.env.NEXTAUTH_SECRET.length + ' chars)' : 'NÃO DEFINIDA',
      AUTH_SECRET: process.env.AUTH_SECRET ? 'DEFINIDA (' + process.env.AUTH_SECRET.length + ' chars)' : 'NÃO DEFINIDA',
      NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDA',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NÃO DEFINIDA',
    }

    // Testar login manualmente
    const email = 'admin@unicabeneficios.com.br'
    const password = 'Admin@2026!'

    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true, parceiro: true, assinante: true }
    })

    if (!user) {
      return NextResponse.json({
        status: 'ERRO',
        problema: 'Usuário não encontrado',
        env: envCheck
      })
    }

    const passwordValid = await compare(password, user.password)

    // Simular o que o auth.ts faz
    const authSimulation = {
      userFound: true,
      passwordValid,
      isActive: user.isActive,
      role: user.role,
      hasAdminRecord: !!user.admin,
      hasParceiroRecord: !!user.parceiro,
      hasAssinanteRecord: !!user.assinante,
    }

    // Verificar se passaria na validação do auth
    const wouldPass = passwordValid && user.isActive

    return NextResponse.json({
      status: wouldPass ? 'DEVERIA FUNCIONAR' : 'VAI FALHAR',
      env: envCheck,
      authSimulation,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      dica: wouldPass 
        ? 'Se não funciona, problema pode ser: 1) Cookie/sessão antiga 2) NEXTAUTH_URL errada 3) Middleware bloqueando'
        : 'Problema identificado na simulação'
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'ERRO',
      error: String(error)
    }, { status: 500 })
  }
}
