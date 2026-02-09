import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.redirect(new URL('/admin/configuracoes?error=Token inválido', request.url))
        }

        const user = await prisma.user.findFirst({
            where: {
                emailChangeToken: token,
                emailChangeExpiry: { gt: new Date() }
            }
        })

        if (!user || !user.pendingEmail) {
            return NextResponse.redirect(new URL('/admin/configuracoes?error=Token expirado ou inválido', request.url))
        }

        // Atualizar email
        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: user.pendingEmail,
                pendingEmail: null,
                emailChangeToken: null,
                emailChangeExpiry: null,
            }
        })

        return NextResponse.redirect(new URL('/admin/configuracoes?success=E-mail alterado com sucesso!', request.url))
    } catch (error) {
        console.error('[CONFIRM-EMAIL] Erro:', error)
        return NextResponse.redirect(new URL('/admin/configuracoes?error=Erro ao processar', request.url))
    }
}
