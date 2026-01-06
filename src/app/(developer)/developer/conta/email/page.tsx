'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Mail, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">E-mail alterado!</h1>
          <p className="text-slate-500 mb-4">
            Seu e-mail foi alterado para <strong>{newEmail}</strong>
          </p>
          <p className="text-sm text-slate-400">
            Use o novo e-mail para fazer login.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Alterar E-mail</h1>
        <p className="text-slate-500">
          E-mail atual: <strong>{session?.user?.email}</strong>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Novo E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="novo@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                Um código de verificação será enviado para o novo e-mail para confirmar a alteração.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar código
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código de Verificação
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-center text-2xl font-mono tracking-widest placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
              />
              <p className="text-sm text-slate-500 mt-2 text-center">
                Digite o código de 6 dígitos enviado para <strong>{newEmail}</strong>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
