'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Copy, Check, ExternalLink, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface BoletoResultProps {
  boletoData: {
    bankSlipUrl?: string
    identificationField?: string
    dueDate?: string
  }
}

export default function CheckoutBoletoResult({ boletoData }: BoletoResultProps) {
  const [copied, setCopied] = useState(false)

  const copyBarcode = () => {
    if (boletoData.identificationField) {
      navigator.clipboard.writeText(boletoData.identificationField)
      setCopied(true)
      toast.success('Código de barras copiado!')
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <Card>
      <CardContent className="py-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="h-7 w-7 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold">Boleto Gerado!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pague até o vencimento para ativar seu plano
          </p>
          {boletoData.dueDate && (
            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-amber-600">
              <Clock className="h-3.5 w-3.5" />
              <span>Vencimento: {new Date(boletoData.dueDate).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Código de barras */}
        {boletoData.identificationField && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground">Código de barras:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg p-3 text-xs font-mono break-all">
                {boletoData.identificationField}
              </div>
              <Button variant="outline" size="icon" onClick={copyBarcode} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col gap-2">
          {boletoData.bankSlipUrl && (
            <Button asChild className="w-full">
              <a href={boletoData.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizar Boleto
              </a>
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login?redirect=/app'}>
            Acessar Minha Conta
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Após a compensação do pagamento (1-3 dias úteis), seu plano será ativado automaticamente.
        </p>
      </CardContent>
    </Card>
  )
}
