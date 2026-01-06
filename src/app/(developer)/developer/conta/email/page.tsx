'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Mail, Loader2, CheckCircle, ArrowRight, Terminal } from 'lucide-react'
import { toast } from 'sonner'

export default function AlterarEmailPage() {
  const { data: session, update } = useSession()
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email')
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/developer/conta/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar código')
      }

      toast.success('Código enviado para o novo e-mail!')
      setStep('code')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/developer/conta/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido')
      }

      // Atualizar sessão
      await update({ email: newEmail })

      toast.success('E-mail alterado com sucesso!')
      setStep('success')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-mono mb-2">email_updated()</h1>
          <p className="text-slate-400 font-mono mb-4">
            <span className="text-slate-500">// new_email:</span> <span className="text-emerald-400">{newEmail}</span>
          </p>
          <p className="text-sm text-slate-500 font-mono">
            // use o novo e-mail para fazer login
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Mail className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">change_email()</h1>
            <p className="text-slate-500 text-sm font-mono">
              // current: <span className="text-emerald-400">{session?.user?.email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-2">
                new_email:
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="novo@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm text-amber-400 font-mono">
                <span className="text-amber-500">// WARN:</span> um código de verificação será enviado para o novo e-mail
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-xl font-mono font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  sending...
                </>
              ) : (
                <>
                  send_code()
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-2">
                verification_code:
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-emerald-400 text-center text-2xl font-mono tracking-widest placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <p className="text-sm text-slate-500 mt-2 text-center font-mono">
                // código de 6 dígitos enviado para <span className="text-emerald-400">{newEmail}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="flex-1 py-3 px-4 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl font-mono transition-all"
              >
                back()
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-xl font-mono font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    verifying...
                  </>
                ) : (
                  'confirm()'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
