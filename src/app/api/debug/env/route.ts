import { NextResponse } from 'next/server'

export async function GET() {
  // Lista todas as variaveis VAPID (sem expor valores sensíveis completos)
  const envCheck = {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: !!process.env.VAPID_SUBJECT,
    // Mostra primeiros caracteres para debug
    publicKeyPreview: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 15) + '...',
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(envCheck)
}
