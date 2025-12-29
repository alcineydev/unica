import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Fallback values
const FALLBACK_PUBLIC_KEY = 'BDgxbvXNieDaGmEvQxgwa1GQSt_4Fq-NjC2VwHmXp0dIXVLwKXNOEzg6GH1kEX6bAt9DGSBh_HCS1ebaIUsRQYM'

export async function GET() {
  // Bloquear se não for DEVELOPER
  const session = await auth()
  if (!session || session.user.role !== 'DEVELOPER') {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    )
  }

  const hasEnvPublic = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const hasEnvPrivate = !!process.env.VAPID_PRIVATE_KEY
  const hasEnvSubject = !!process.env.VAPID_SUBJECT

  const envCheck = {
    // Status das env vars
    envVars: {
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: hasEnvPublic,
      VAPID_PRIVATE_KEY: hasEnvPrivate,
      VAPID_SUBJECT: hasEnvSubject
    },
    // Indica se esta usando fallback
    usingFallback: !hasEnvPublic,
    // Preview da key em uso
    publicKeyPreview: (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_PUBLIC_KEY).substring(0, 20) + '...',
    // Info do ambiente
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(envCheck)
}
