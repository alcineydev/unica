'use client'

import { useState } from 'react'
<<<<<<< HEAD
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
=======
import { Lock, Loader2, CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react'
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
import { toast } from 'sonner'

export default function AlterarSenhaPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/developer/conta/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha')
      }

      toast.success('Senha alterada com sucesso!')
      setSuccess(true)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
<<<<<<< HEAD
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Senha alterada!</h1>
          <p className="text-slate-500">
            Sua senha foi alterada com sucesso. Use a nova senha no próximo login.
=======
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-mono mb-2">password_updated()</h1>
          <p className="text-slate-400 font-mono">
            <span className="text-slate-500">// status:</span> <span className="text-emerald-400">SUCCESS</span>
          </p>
          <p className="text-sm text-slate-500 font-mono mt-4">
            // use a nova senha no próximo login
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
<<<<<<< HEAD
        <h1 className="text-2xl font-bold text-slate-900">Alterar Senha</h1>
        <p className="text-slate-500">Escolha uma senha forte e única</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
=======
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <KeyRound className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">change_password()</h1>
            <p className="text-slate-500 text-sm font-mono">// escolha uma senha forte e única</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-slate-400 mb-2">
              current_password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
              <input
                type={showPasswords ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="••••••••"
                required
<<<<<<< HEAD
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
=======
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
<<<<<<< HEAD
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
=======
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
              >
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
=======
            <label className="block text-sm font-mono text-slate-400 mb-2">
              new_password: <span className="text-slate-600">// min: 6 chars</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
              <input
                type={showPasswords ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
<<<<<<< HEAD
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
=======
                placeholder="nova senha"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
              />
            </div>
          </div>

          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
=======
            <label className="block text-sm font-mono text-slate-400 mb-2">
              confirm_password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
              <input
                type={showPasswords ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
<<<<<<< HEAD
                placeholder="Repita a nova senha"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
=======
                placeholder="repita a nova senha"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
<<<<<<< HEAD
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
=======
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-xl font-mono font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
<<<<<<< HEAD
                Alterando...
              </>
            ) : (
              'Alterar Senha'
=======
                updating...
              </>
            ) : (
              'update_password()'
>>>>>>> origin/claude/fix-login-theme-toggle-Xo55B
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
