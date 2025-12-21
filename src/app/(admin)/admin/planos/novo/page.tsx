'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function NovoPlanoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página de planos com parâmetro para abrir o modal
    router.replace('/admin/planos?action=create')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  )
}
