'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, 
  Percent, 
  Coins, 
  Star, 
  Loader2,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BenefitValue {
  percentage?: number
  monthlyPoints?: number
}

interface Benefit {
  id: string
  name: string
  type: string
  value: BenefitValue
  description?: string
  isActive: boolean
}

export default function ParceiroBeneficiosPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBenefits()
  }, [])

  const fetchBenefits = async () => {
    try {
      const response = await fetch('/api/parceiro/beneficios')
      const data = await response.json()
      
      if (data.benefits) {
        setBenefits(data.benefits)
      }
    } catch (error) {
      console.error('Erro ao buscar benefícios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'DESCONTO': return <Percent className="h-5 w-5 text-green-600" />
      case 'CASHBACK': return <Coins className="h-5 w-5 text-yellow-600" />
      case 'PONTOS': return <Star className="h-5 w-5 text-blue-600" />
      case 'ACESSO_EXCLUSIVO': return <Gift className="h-5 w-5 text-purple-600" />
      default: return <Gift className="h-5 w-5" />
    }
  }

  const getBenefitColor = (type: string) => {
    switch (type) {
      case 'DESCONTO': return 'bg-green-100'
      case 'CASHBACK': return 'bg-yellow-100'
      case 'PONTOS': return 'bg-blue-100'
      case 'ACESSO_EXCLUSIVO': return 'bg-purple-100'
      default: return 'bg-muted'
    }
  }

  const formatValue = (benefit: Benefit) => {
    const value = benefit.value
    switch (benefit.type) {
      case 'DESCONTO':
        return `${value.percentage || 0}% de desconto`
      case 'CASHBACK':
        return `${value.percentage || 0}% de cashback`
      case 'PONTOS':
        return `${value.monthlyPoints || 0} pontos/mês`
      case 'ACESSO_EXCLUSIVO':
        return 'Acesso exclusivo'
      default:
        return '-'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Meus Benefícios</h1>
        <p className="text-sm text-muted-foreground">
          Benefícios que você oferece aos assinantes
        </p>
      </div>

      {/* Lista de Benefícios */}
      {benefits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum benefício vinculado ainda.<br />
              Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <Card key={benefit.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-3 rounded-lg flex-shrink-0",
                    getBenefitColor(benefit.type)
                  )}>
                    {getBenefitIcon(benefit.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{benefit.name}</p>
                      {benefit.isActive && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-green-600 font-medium mb-1">
                      {formatValue(benefit)}
                    </p>
                    {benefit.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {benefit.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

