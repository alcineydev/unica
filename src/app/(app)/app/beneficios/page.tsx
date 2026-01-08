'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/app/app-header'
import { Gift, MapPin, Tag, ArrowRight, Loader2, Store, Crown } from 'lucide-react'

interface Benefit {
  id: string
  name: string
  description: string
  type: string
  value: unknown
  category: string | null
}

interface Parceiro {
  id: string
  companyName: string
  tradeName: string | null
  logo: string | null
  banner: string | null
  category: string
  description: string | null
  city: { id: string; name: string; state: string } | null
  benefits: Array<{
    id: string
    name: string
    type: string
    value: unknown
  }>
}

interface PlanInfo {
  id: string
  name: string
  description: string | null
}

export default function BeneficiosPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchBenefits()
  }, [])

  const fetchBenefits = async () => {
    try {
      const response = await fetch('/api/app/beneficios')
      const data = await response.json()

      if (data.error) {
        setMessage(data.error)
      } else {
        setPlan(data.plan || null)
        setBenefits(data.benefits || [])
        setParceiros(data.parceiros || [])
        setMessage(data.message || null)
      }
    } catch (error) {
      console.error('Erro ao buscar benefícios:', error)
      setMessage('Erro ao carregar benefícios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="p-4 space-y-4 pb-24">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">Meus Benefícios</h1>
          <p className="text-sm text-slate-500">Veja todos os benefícios do seu plano</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : message && benefits.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              Nenhum benefício disponível
            </h2>
            <p className="text-slate-500 mb-4">
              {message}
            </p>
            <Link
              href="/app/planos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg"
            >
              Ver Planos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Card do Plano */}
            {plan && (
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-brand-100 text-sm">Seu plano</p>
                    <h2 className="text-lg font-bold">{plan.name}</h2>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <div>
                    <span className="text-brand-200">Benefícios:</span>
                    <span className="ml-1 font-semibold">{benefits.length}</span>
                  </div>
                  <div>
                    <span className="text-brand-200">Parceiros:</span>
                    <span className="ml-1 font-semibold">{parceiros.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Benefícios */}
            {benefits.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                  Benefícios do Plano
                </h2>
                <div className="space-y-3">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.id}
                      className="bg-white rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">
                            {benefit.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {benefit.description}
                          </p>
                          {benefit.category && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                              {benefit.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lista de Parceiros */}
            {parceiros.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                  Parceiros Disponíveis
                </h2>
                <div className="space-y-3">
                  {parceiros.map((parceiro) => (
                    <Link
                      key={parceiro.id}
                      href={`/app/parceiros/${parceiro.id}`}
                      className="block bg-white rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {parceiro.logo ? (
                          <img
                            src={parceiro.logo}
                            alt={parceiro.tradeName || parceiro.companyName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Store className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {parceiro.tradeName || parceiro.companyName}
                          </h3>
                          <p className="text-sm text-slate-500 truncate">
                            {parceiro.category}
                          </p>
                          {parceiro.city && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {parceiro.city.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-brand-600 font-medium">
                            {parceiro.benefits.length} benefício{parceiro.benefits.length !== 1 ? 's' : ''}
                          </span>
                          <ArrowRight className="w-5 h-5 text-slate-400 mt-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
