import { NextResponse } from 'next/server'

export async function GET() {
  // Mostra EXATAMENTE o que as variáveis estão retornando em runtime
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    
    // Cloudinary
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'NOT_SET (default: unica/dev)',
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'NOT_SET',
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'NOT_SET (default: unica_unsigned)',
    
    // Cálculo do folder final
    folder_example: `${process.env.CLOUDINARY_FOLDER || 'unica/dev'}/avatars`,
    
    timestamp: new Date().toISOString()
  })
}

