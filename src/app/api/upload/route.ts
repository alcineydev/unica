export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  console.log('[UPLOAD] ====== INICIO ======')
  
  try {
    // Verificar autenticação
    const session = await auth()
    console.log('[UPLOAD] Session:', session?.user?.email || 'não autenticado')
    
    if (!session || !['DEVELOPER', 'ADMIN', 'PARCEIRO', 'ASSINANTE'].includes(session.user.role)) {
      console.log('[UPLOAD] Não autorizado - role:', session?.user?.role)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Pegar dados do form
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'

    console.log('[UPLOAD] File:', file?.name, file?.size, file?.type)
    console.log('[UPLOAD] Folder:', folder)

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF' 
      }, { status: 400 })
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo: 5MB' 
      }, { status: 400 })
    }

    // Converter para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('[UPLOAD] Buffer size:', buffer.length)

    // Upload para Cloudinary
    const publicUrl = await uploadToCloudinary(buffer, `unica/${folder}`)
    console.log('[UPLOAD] URL retornada:', publicUrl)

    if (!publicUrl) {
      console.log('[UPLOAD] Falha no upload para Cloudinary')
      return NextResponse.json({ 
        error: 'Erro ao fazer upload. Verifique as configurações do Cloudinary.' 
      }, { status: 500 })
    }

    console.log('[UPLOAD] ====== SUCESSO ======')
    return NextResponse.json({ 
      success: true,
      url: publicUrl
    })

  } catch (error) {
    console.error('[UPLOAD] ====== ERRO ======')
    console.error('[UPLOAD] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
