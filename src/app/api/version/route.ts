import { NextResponse } from 'next/server'
import { APP_VERSION, BUILD_TIMESTAMP } from '@/lib/version'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return NextResponse.json(
    { version: APP_VERSION, build: BUILD_TIMESTAMP },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  )
}
