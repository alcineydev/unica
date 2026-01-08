'use client'

import { AppHeader } from '@/components/app/app-header'
import {
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  CreditCard,
  Users,
  Shield,
  FileText
} from 'lucide-react'
import Link from 'next/link'

const faqItems = [
  {
    icon: CreditCard,
    question: 'Como funciona a assinatura?',
    answer: 'Sua assinatura dá acesso a todos os benefícios dos parceiros cadastrados. O pagamento é recorrente conforme o plano escolhido.',
  },
  {
    icon: Users,
    question: 'Como uso meus benefícios?',
    answer: 'Apresente sua carteirinha digital no estabelecimento parceiro. O parceiro vai escanear o QR Code para validar seu benefício.',
  },
  {
    icon: Shield,
    question: 'Meus dados estão seguros?',
    answer: 'Sim! Utilizamos criptografia e seguimos todas as normas da LGPD para proteger suas informações.',
  },
  {
    icon: FileText,
    question: 'Como cancelo minha assinatura?',
    answer: 'Você pode cancelar a qualquer momento na página de perfil ou entrando em contato com nosso suporte.',
  },
]

const contactOptions = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '(66) 99249-7137',
    href: 'https://wa.me/5566992497137',
    color: 'bg-green-500',
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: 'suporte@unicabeneficios.com.br',
    href: 'mailto:suporte@unicabeneficios.com.br',
    color: 'bg-blue-500',
  },
  {
    icon: Phone,
    label: 'Telefone',
    value: '(66) 99249-7137',
    href: 'tel:+5566992497137',
    color: 'bg-slate-500',
  },
]

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="p-4 space-y-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">Ajuda</h1>
          <p className="text-sm text-slate-500">Tire suas dúvidas e fale conosco</p>
        </div>

        {/* Contato */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Fale Conosco
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {contactOptions.map((option) => {
              const Icon = option.icon
              return (
                <a
                  key={option.label}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{option.label}</p>
                    <p className="text-sm text-slate-500">{option.value}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </a>
              )
            })}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Perguntas Frequentes
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-1">
                        {item.question}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Links */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Informações
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <Link
              href="/termos"
              className="flex items-center justify-between p-4 border-b border-slate-100"
            >
              <span className="text-slate-700">Termos de Uso</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              href="/privacidade"
              className="flex items-center justify-between p-4"
            >
              <span className="text-slate-700">Política de Privacidade</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
