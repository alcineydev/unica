'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Star, 
  Loader2,
  CheckCircle,
  ArrowLeft,
  Gift
} from 'lucide-react'
import { toast } from 'sonner'

interface Parceiro {
  id: string
  nome: string
  logo?: string
}

export default function AvaliarPage({ params }: { params: Promise<{ parceiroId: string }> }) {
  const { parceiroId } = use(params)
  const router = useRouter()
  const [parceiro, setParceiro] = useState<Parceiro | null>(null)
  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchParceiro()
  }, [parceiroId])

  const fetchParceiro = async () => {
    try {
      const response = await fetch(`/api/parceiros/${parceiroId}`)
      const data = await response.json()

      if (data.parceiro) {
        setParceiro({
          id: data.parceiro.id,
          nome: data.parceiro.tradeName || data.parceiro.companyName || 'Parceiro',
          logo: data.parceiro.logo
        })
      }
    } catch (error) {
      console.error('Erro ao carregar parceiro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const enviarAvaliacao = async () => {
    if (nota === 0) {
      toast.error('Selecione uma nota')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/app/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parceiroId,
          nota,
          comentario: comentario.trim() || null
        })
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setSuccess(true)
      toast.success('Avaliação enviada! +1 ponto')
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
      toast.error('Erro ao enviar avaliação')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-gray-500 mb-4">
              Sua avaliação foi enviada com sucesso
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-6">
              <Gift className="h-5 w-5" />
              <span className="font-semibold">+1 ponto adicionado!</span>
            </div>
            <Button onClick={() => router.push('/app')} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:px-10 lg:pt-8 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Avaliar</h1>
          <p className="text-sm text-gray-500">Como foi sua experiência?</p>
        </div>
      </div>

      {/* Parceiro */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={parceiro?.logo} />
            <AvatarFallback className="bg-blue-50 text-blue-600 text-lg">
              {parceiro?.nome?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{parceiro?.nome || 'Carregando...'}</h2>
            <p className="text-sm text-gray-500">Avalie sua experiência</p>
          </div>
        </CardContent>
      </Card>

      {/* Estrelas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Qual sua nota?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNota(star)}
                onMouseEnter={() => setHoverNota(star)}
                onMouseLeave={() => setHoverNota(0)}
                className="p-1 transition-transform hover:scale-110"
                title={`${star} estrela${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoverNota || nota)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {nota === 0 && 'Toque nas estrelas para avaliar'}
            {nota === 1 && 'Muito ruim'}
            {nota === 2 && 'Ruim'}
            {nota === 3 && 'Regular'}
            {nota === 4 && 'Bom'}
            {nota === 5 && 'Excelente!'}
          </p>
        </CardContent>
      </Card>

      {/* Comentário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentário (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Conte como foi sua experiência..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-2 text-right">
            {comentario.length}/500
          </p>
        </CardContent>
      </Card>

      {/* Bonificação */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
        <Gift className="h-4 w-4 text-blue-600" />
        <span>Ganhe <strong className="text-blue-600">+1 ponto</strong> ao avaliar!</span>
      </div>

      {/* Botão Enviar */}
      <Button
        onClick={enviarAvaliacao}
        disabled={nota === 0 || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Star className="h-5 w-5 mr-2" />
            Enviar Avaliação
          </>
        )}
      </Button>
    </div>
  )
}
