import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body = await request.json()
        const { action, ids } = body

        if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }

        let result

        switch (action) {
            case 'activate':
                result = await prisma.parceiro.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: true }
                })
                return NextResponse.json({
                    message: `${result.count} parceiro(s) ativado(s)`,
                    count: result.count
                })

            case 'deactivate':
                result = await prisma.parceiro.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: false }
                })
                return NextResponse.json({
                    message: `${result.count} parceiro(s) desativado(s)`,
                    count: result.count
                })

            case 'delete':
                // Primeiro verificar se os parceiros existem
                const parceiros = await prisma.parceiro.findMany({
                    where: { id: { in: ids } },
                    select: { id: true, userId: true }
                })

                if (parceiros.length === 0) {
                    return NextResponse.json({ error: 'Nenhum parceiro encontrado' }, { status: 404 })
                }

                // Deletar parceiros e usuários relacionados
                const userIds = parceiros.map(p => p.userId).filter(Boolean)

                // Deletar parceiros
                result = await prisma.parceiro.deleteMany({
                    where: { id: { in: ids } }
                })

                // Deletar usuários relacionados
                if (userIds.length > 0) {
                    await prisma.user.deleteMany({
                        where: { id: { in: userIds as string[] } }
                    })
                }

                return NextResponse.json({
                    message: `${result.count} parceiro(s) excluído(s)`,
                    count: result.count
                })

            case 'change_category':
                const { category } = body
                if (!category) {
                    return NextResponse.json({ error: 'Categoria não informada' }, { status: 400 })
                }
                result = await prisma.parceiro.updateMany({
                    where: { id: { in: ids } },
                    data: { category }
                })
                return NextResponse.json({
                    message: `${result.count} parceiro(s) atualizado(s)`,
                    count: result.count
                })

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

    } catch (error) {
        console.error('[PARCEIROS BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
