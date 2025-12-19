import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    // Por enquanto retorna 0 - implementar quando tiver sistema de notificações
    // const count = await prisma.notification.count({
    //   where: { userId: session.user.id, read: false }
    // })

    return NextResponse.json({ count: 0 })
  } catch (error) {
    console.error('[NOTIFICATIONS COUNT] Erro:', error)
    return NextResponse.json({ count: 0 })
  }
}
