'use client'

import { useState } from 'react'
import { Lock, Loader2, CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react'
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
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-mono mb-2">password_updated()</h1>
          <p className="text-slate-400 font-mono">
            // use a nova senha no próximo login
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-emerald-400" />
          change_password()
        </h1>
        <p className="text-slate-500 font-mono text-sm">// escolha uma senha forte</p>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono">
              current_password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono">
              new_password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="min 6 chars"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 font-mono">
              confirm_password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="repeat password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-500 text-slate-900 rounded-xl font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-mono"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                updating...
              </>
            ) : (
              'update_password()'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
