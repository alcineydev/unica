'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

function ConfirmarEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token não encontrado')
      return
    }

    confirmEmail()
  }, [token])

  const confirmEmail = async () => {
    try {
      const response = await fetch('/api/auth/confirm-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao confirmar')
      }

      setStatus('success')
      setMessage('E-mail alterado com sucesso!')
      setNewEmail(data.newEmail)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Confirmando...</h1>
              <p className="text-slate-400">Aguarde enquanto verificamos seu token.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">E-mail Confirmado!</h1>
              <p className="text-slate-400 mb-4">{message}</p>
              {newEmail && (
                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <Mail className="w-5 h-5" />
                    <span className="font-mono">{newEmail}</span>
                  </div>
                </div>
              )}
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 px-4 bg-emerald-500 text-slate-900 rounded-xl font-bold hover:bg-emerald-400 transition-all"
              >
                Fazer Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Erro na Confirmação</h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 px-4 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all"
              >
                Voltar ao Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    }>
      <ConfirmarEmailContent />
    </Suspense>
  )
}
