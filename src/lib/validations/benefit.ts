import { z } from 'zod'

// Schema para DESCONTO
const descontoConfigSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
})

// Schema para CASHBACK
const cashbackConfigSchema = z.object({
  percentage: z.number().min(0).max(100),
})

// Schema para PONTOS
const pontosConfigSchema = z.object({
  multiplier: z.number().min(1),
})

// Schema para ACESSO_EXCLUSIVO
const acessoExclusivoConfigSchema = z.object({
  description: z.string().optional(),
})

// Schema de criação de benefício
export const createBenefitSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  type: z.enum(['DESCONTO', 'CASHBACK', 'PONTOS', 'ACESSO_EXCLUSIVO']),
  value: z.union([
    descontoConfigSchema,
    cashbackConfigSchema,
    pontosConfigSchema,
    acessoExclusivoConfigSchema,
    z.object({}).passthrough(), // Aceita objeto vazio ou outros
  ]),
  isActive: z.boolean().default(true),
})

// Schema de atualização (todos opcionais)
export const updateBenefitSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['DESCONTO', 'CASHBACK', 'PONTOS', 'ACESSO_EXCLUSIVO']).optional(),
  value: z.union([
    descontoConfigSchema,
    cashbackConfigSchema,
    pontosConfigSchema,
    acessoExclusivoConfigSchema,
    z.object({}).passthrough(),
  ]).optional(),
  isActive: z.boolean().optional(),
})

export type CreateBenefitInput = z.infer<typeof createBenefitSchema>
export type UpdateBenefitInput = z.infer<typeof updateBenefitSchema>

// Validação de configuração por tipo
export function validateBenefitConfig(
  type: string,
  value: Record<string, unknown>
): { success: boolean; error?: string } {
  try {
    switch (type) {
      case 'DESCONTO':
        descontoConfigSchema.parse(value)
        break
      case 'CASHBACK':
        cashbackConfigSchema.parse(value)
        break
      case 'PONTOS':
        pontosConfigSchema.parse(value)
        break
      case 'ACESSO_EXCLUSIVO':
        acessoExclusivoConfigSchema.parse(value)
        break
      default:
        return { success: false, error: 'Tipo de benefício inválido' }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Configuração inválida para o tipo de benefício' }
  }
}

