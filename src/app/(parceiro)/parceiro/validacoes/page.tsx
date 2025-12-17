'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { QRCodeScanner } from '@/components/qrcode'
import {
  QrCode,
  Search,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Gift,
  CreditCard,
  Phone,
  AlertCircle,
  Coins,
  Keyboard,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'

interface AssinanteInfo {
  id: string
  nome: string
  email: string
  telefone: string
  cpf: string
  foto?: string
  plano: {
    id: string
    nome: string
  }
  status: string
  pontos: number
  cashback: number
  beneficiosDisponiveis: {
    id: string
    nome: string
    tipo: string
    valor: Record<string, unknown>
  }[]
}

export default function ValidacoesPage() {
  const [activeTab, setActiveTab] = useState('qrcode')
  const [cpfBusca, setCpfBusca] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [assinante, setAssinante] = useState<AssinanteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [beneficioSelecionado, setBeneficioSelecionado] = useState<string | null>(null)
  const [isValidando, setIsValidando] = useState(false)

  // Buscar assinante por QR Code (que contém o ID ou CPF)
  const handleQRScan = async (qrData: string) => {
    console.log('[VALIDACAO] QR lido:', qrData)
    await buscarAssinante(qrData, 'qrcode')
  }

  // Buscar assinante por CPF
  const handleBuscaCPF = async (e: React.FormEvent) => {
    e.preventDefault()
    const cpfLimpo = cpfBusca.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setError('CPF deve ter 11 dígitos')
      return
    }
    await buscarAssinante(cpfLimpo, 'cpf')
  }

  // Função principal de busca
  const buscarAssinante = async (valor: string, tipo: 'qrcode' | 'cpf') => {
    setIsLoading(true)
    setError(null)
    setAssinante(null)
    setBeneficioSelecionado(null)

    try {
      const response = await fetch(`/api/parceiro/validar?${tipo}=${encodeURIComponent(valor)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Assinante não encontrado')
        toast.error(data.error || 'Assinante não encontrado')
        return
      }

      setAssinante(data.assinante)
      toast.success(`Assinante encontrado: ${data.assinante.nome}`)

    } catch (err) {
      console.error('[VALIDACAO] Erro:', err)
      setError('Erro ao buscar assinante')
      toast.error('Erro ao buscar assinante')
    } finally {
      setIsLoading(false)
    }
  }

  // Registrar uso do benefício
  const handleValidarBeneficio = async () => {
    if (!assinante || !beneficioSelecionado) return

    setIsValidando(true)

    try {
      const response = await fetch('/api/parceiro/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assinanteId: assinante.id,
          beneficioId: beneficioSelecionado
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao validar benefício')
        return
      }

      toast.success('Benefício validado com sucesso!')
      
      // Limpar estado para nova validação
      setAssinante(null)
      setBeneficioSelecionado(null)
      setCpfBusca('')

    } catch (err) {
      console.error('[VALIDACAO] Erro:', err)
      toast.error('Erro ao validar benefício')
    } finally {
      setIsValidando(false)
    }
  }

  // Formatar CPF para exibição
  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '')
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Obter label do tipo de benefício
  const getBeneficioLabel = (tipo: string, valor: Record<string, unknown>) => {
    switch (tipo) {
      case 'DESCONTO':
        return `${valor?.percentage || 0}% de desconto`
      case 'CASHBACK':
        return `${valor?.percentage || 0}% de cashback`
      case 'FREEBIE':
        return 'Brinde/Cortesia'
      case 'SERVICE':
        return 'Serviço especial'
      default:
        return tipo
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="h-6 w-6" />
          Validar Assinante
        </h1>
        <p className="text-muted-foreground">
          Escaneie o QR Code ou busque pelo CPF do assinante
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Scanner/Busca */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode">
                <Camera className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="cpf">
                <Keyboard className="h-4 w-4 mr-2" />
                Buscar CPF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qrcode" className="mt-4">
              {!assinante ? (
                <QRCodeScanner 
                  onScan={handleQRScan}
                  onError={(err) => setError(err)}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Cliente identificado!</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAssinante(null)
                        setError(null)
                      }}
                    >
                      Escanear Outro
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cpf" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Buscar por CPF</CardTitle>
                  <CardDescription>
                    Digite o CPF do assinante para validar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBuscaCPF} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF do Assinante</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={cpfBusca}
                        onChange={(e) => setCpfBusca(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Buscar Assinante
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Coluna Direita - Resultado */}
        <div>
          {isLoading ? (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Buscando assinante...</p>
              </CardContent>
            </Card>
          ) : assinante ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{assinante.nome}</CardTitle>
                      <CardDescription>{assinante.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={assinante.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {assinante.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Info do Assinante */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCPF(assinante.cpf)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{assinante.telefone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <span>Plano: <strong>{assinante.plano.nome}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span>Pontos: <strong>{assinante.pontos}</strong></span>
                  </div>
                </div>

                <Separator />

                {/* Benefícios Disponíveis */}
                {assinante.status !== 'ACTIVE' ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este assinante não possui uma assinatura ativa.
                    </AlertDescription>
                  </Alert>
                ) : assinante.beneficiosDisponiveis.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum benefício disponível para este assinante neste estabelecimento.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium mb-3">Selecione o benefício utilizado:</h4>
                      <div className="space-y-2">
                        {assinante.beneficiosDisponiveis.map((beneficio) => (
                          <div
                            key={beneficio.id}
                            onClick={() => setBeneficioSelecionado(beneficio.id)}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              beneficioSelecionado === beneficio.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{beneficio.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getBeneficioLabel(beneficio.tipo, beneficio.valor)}
                                </p>
                              </div>
                              {beneficioSelecionado === beneficio.id && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleValidarBeneficio}
                      disabled={!beneficioSelecionado || isValidando}
                      className="w-full"
                      size="lg"
                    >
                      {isValidando ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmar Uso do Benefício
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhum assinante selecionado</h3>
                <p className="text-muted-foreground text-sm">
                  Escaneie o QR Code ou busque pelo CPF para validar um assinante
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
