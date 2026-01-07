'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Eye, EyeOff, Terminal, Mail, AlertCircle, CheckCircle, Key } from 'lucide-react'
import { toast } from 'sonner'

interface Admin {
  id: string
  name: string | null
  email: string
  phone: string | null
  isActive: boolean
}

interface AdminModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  admin: Admin | null
}

export function AdminModal({ open, onClose, onSuccess, admin }: AdminModalProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'pending' | null
    message: string
    details?: string[]
  }>({ type: null, message: '', details: [] })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        email: admin.email,
        phone: admin.phone || '',
        password: '',
      })
      setResultMessage({ type: null, message: '', details: [] })
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
      })
      setResultMessage({ type: null, message: '', details: [] })
    }
  }, [admin, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResultMessage({ type: null, message: '', details: [] })

    try {
      const url = admin
        ? `/api/developer/admins/${admin.id}`
        : '/api/developer/admins'

      const method = admin ? 'PATCH' : 'POST'

      const body: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }

      // Sempre enviar a senha se foi preenchida (mesmo na edição)
      if (formData.password && formData.password.length > 0) {
        body.password = formData.password
      }

      console.log('[MODAL] Enviando dados:', { ...body, password: body.password ? '***' : undefined })

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      console.log('[MODAL] Resposta:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar')
      }

      // Montar detalhes das alterações
      const details: string[] = []
      if (data.passwordChanged) {
        details.push('✓ Senha alterada com sucesso')
      }
      if (data.changes?.includes('nome')) {
        details.push('✓ Nome atualizado')
      }
      if (data.changes?.includes('telefone')) {
        details.push('✓ Telefone atualizado')
      }

      // Se o e-mail foi alterado, mostrar mensagem de pendente
      if (data.emailPending) {
        setResultMessage({
          type: 'pending',
          message: `Link de confirmação enviado para ${formData.email}`,
          details
        })
        toast.success('Alterações salvas! Aguardando confirmação do e-mail.')
      } else if (details.length > 0 || !admin) {
        // Mostrar sucesso e fechar
        toast.success(admin ? 'Admin atualizado com sucesso!' : 'Admin criado com sucesso!')
        if (data.passwordChanged) {
          toast.success('🔐 Senha alterada com sucesso!', { duration: 5000 })
        }
        onSuccess()
      } else {
        toast.info('Nenhuma alteração realizada')
        onClose()
      }
    } catch (error: any) {
      console.error('[MODAL] Erro:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setResultMessage({ type: null, message: '', details: [] })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 rounded-2xl shadow-xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white font-mono flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            {admin ? 'edit_admin()' : 'new_admin()'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de resultado */}
        {resultMessage.type === 'pending' && (
          <div className="mx-6 mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-400 font-medium font-mono text-sm">
                  // aguardando confirmação de e-mail
                </p>
                <p className="text-amber-300/80 text-sm mt-1">
                  {resultMessage.message}
                </p>
                {resultMessage.details && resultMessage.details.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20">
                    <p className="text-emerald-400 text-xs font-mono mb-1">// outras alterações:</p>
                    {resultMessage.details.map((detail, i) => (
                      <p key={i} className="text-emerald-300/80 text-sm">{detail}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full mt-4 py-2 px-4 bg-amber-500/20 text-amber-400 rounded-lg font-medium hover:bg-amber-500/30 transition-all font-mono text-sm"
            >
              ok()
            </button>
          </div>
        )}

        {/* Form - esconder se tem mensagem pendente */}
        {resultMessage.type !== 'pending' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 font-mono">
                name:
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do administrador"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 font-mono">
                email:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
                />
              </div>
              {admin && formData.email !== admin.email && (
                <p className="text-xs text-amber-400 mt-1 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  // mudança requer confirmação por e-mail
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 font-mono">
                phone:
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 font-mono flex items-center gap-2">
                <Key className="w-4 h-4" />
                {admin ? 'new_password: (opcional)' : 'password:'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={admin ? 'Deixe vazio para manter a atual' : 'Mínimo 6 caracteres'}
                  required={!admin}
                  minLength={!admin ? 6 : undefined}
                  className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {admin && formData.password.length > 0 && formData.password.length < 6 && (
                <p className="text-xs text-red-400 mt-1 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  // mínimo 6 caracteres
                </p>
              )}
              {admin && formData.password.length >= 6 && (
                <p className="text-xs text-emerald-400 mt-1 font-mono flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  // senha será alterada ao salvar
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-medium hover:bg-slate-800 hover:text-white transition-all font-mono"
              >
                cancel()
              </button>
              <button
                type="submit"
                disabled={loading || (admin && formData.password.length > 0 && formData.password.length < 6)}
                className="flex-1 px-4 py-2.5 bg-emerald-500 text-slate-900 rounded-xl font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-mono"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    saving...
                  </>
                ) : (
                  admin ? 'update()' : 'create()'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
