/**
 * Gera um slug URL-friendly a partir de um texto
 * Ex: "Plano Básico Premium" -> "plano-basico-premium"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
}

/**
 * Formata um valor para exibição como moeda brasileira
 * Ex: 29.90 -> "R$ 29,90"
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) return ''
  
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Converte string de moeda para número
 * Ex: "R$ 29,90" -> 29.90
 */
export function parseCurrency(value: string): number | null {
  if (!value) return null
  
  // Remove R$, espaços e pontos de milhar, troca vírgula por ponto
  const cleaned = value
    .replace(/[R$\s.]/g, '')
    .replace(',', '.')
  
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

