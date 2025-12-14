export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Iniciando upload...')
    console.log('[UPLOAD] Cloud name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    console.log('[UPLOAD] API Key exists:', !!process.env.CLOUDINARY_API_KEY)
    console.log('[UPLOAD] API Secret exists:', !!process.env.CLOUDINARY_API_SECRET)

    const session = await auth()
    
    if (!session || !['DEVELOPER', 'ADMIN', 'PARCEIRO'].includes(session.user.role)) {
      console.log('[UPLOAD] Não autorizado - role:', session?.user?.role)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('[UPLOAD] Usuário autenticado:', session.user.email)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 5MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[UPLOAD] Tamanho do buffer:', buffer.length)
    console.log('[UPLOAD] Iniciando upload para Cloudinary...')

    const publicUrl = await uploadToCloudinary(buffer, `unica/${folder}`)

    if (!publicUrl) {
      console.log('[UPLOAD] Falha no upload - URL vazia')
      return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
    }

    console.log('[UPLOAD] ✅ Upload concluído:', publicUrl)

    return NextResponse.json({ 
      success: true,
      url: publicUrl
    })

  } catch (error) {
    console.error('[UPLOAD] ❌ Erro:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
