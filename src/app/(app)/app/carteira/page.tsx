'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Coins,
  Gift,
  QrCode,
  History,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Transaction {
  id: string
  amount: number
  pointsUsed: number
  cashbackGenerated: number
  type: string
  status: string
  createdAt: string
  parceiro: {
    companyName: string
    tradeName: string
  }
}

interface CarteiraData {
  assinante: {
    name: string
    cpf: string
    qrCode: string
    points: number
    cashback: number
    plan: {
      name: string
    }
  }
  transactions: Transaction[]
}

export default function CarteiraPage() {
  const [data, setData] = useState<CarteiraData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCarteira = useCallback(async () => {
    try {
      const response = await fetch('/api/app/carteira')
      const result = await response.json()
      if (response.ok) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar carteira:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCarteira()
  }, [fetchCarteira])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Componente de QR Code real
  function QRCodeDisplay({ value }: { value: string }) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-lg">
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG
            value={value}
            size={180}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Seu código</p>
          <p className="font-mono text-sm font-bold text-gray-800">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 pt-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-80">Minha Carteira</p>
            {isLoading ? (
              <Skeleton className="h-6 w-32 bg-white/20 mt-1" />
            ) : (
              <p className="text-lg font-bold">{data?.assinante.name}</p>
            )}
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {data?.assinante.plan.name || 'Plano'}
          </Badge>
        </div>

        {/* Saldos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-sm opacity-80">Pontos</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">{data?.assinante.points.toFixed(0)}</p>
            )}
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-sm opacity-80">Cashback</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(data?.assinante.cashback || 0)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Card sobreposto */}
      <div className="px-4 -mt-16">
        <Tabs defaultValue="qrcode" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="qrcode" className="gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              Historico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  {isLoading ? (
                    <Skeleton className="w-48 h-48" />
                  ) : (
                    <>
                      <QRCodeDisplay value={data?.assinante.qrCode || ''} />
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Apresente este QR Code ao parceiro para usar seus beneficios
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">CPF:</span>
                        <span className="font-medium">{formatCPF(data?.assinante.cpf || '')}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ultimas Transacoes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : data?.transactions && data.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {data.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2 ${
                            tx.type === 'PURCHASE'
                              ? 'bg-blue-500/10'
                              : 'bg-green-500/10'
                          }`}>
                            {tx.type === 'PURCHASE' ? (
                              <ArrowDownRight className="h-4 w-4 text-blue-500" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {tx.parceiro.tradeName || tx.parceiro.companyName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(tx.amount)}
                          </p>
                          {tx.pointsUsed > 0 && (
                            <p className="text-xs text-yellow-600">
                              -{tx.pointsUsed.toFixed(0)} pts
                            </p>
                          )}
                          {tx.cashbackGenerated > 0 && (
                            <p className="text-xs text-green-600">
                              +{formatCurrency(tx.cashbackGenerated)} cb
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Nenhuma transacao ainda
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

