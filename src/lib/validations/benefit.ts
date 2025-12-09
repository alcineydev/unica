import { z } from 'zod'

// Schema base para configuração de benefício por tipo
const descontoConfigSchema = z.object({
  percentage: z.number().min(1).max(100),
  category: z.string().optional(),
})

const cashbackConfigSchema = z.object({
  percentage: z.number().min(0.1).max(100),
})

const pontosConfigSchema = z.object({
  monthlyPoints: z.number().min(1),
})

const acessoExclusivoConfigSchema = z.object({
  tier: z.string().optional(),
  partnerIds: z.array(z.string()).optional(),
})

// Schema de criação de benefício
export const createBenefitSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  type: z.enum(['DESCONTO', 'CASHBACK', 'PONTOS', 'ACESSO_EXCLUSIVO']),
  value: z.record(z.string(), z.unknown()), // Validação dinâmica baseada no tipo
  category: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

// Schema de atualização (todos os campos opcionais)
export const updateBenefitSchema = createBenefitSchema.partial()

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

