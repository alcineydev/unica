import { z } from 'zod'

// Helper para converter preço - trata string vazia, null, undefined e NaN
const optionalPrice = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null
    const num = typeof val === 'string' ? parseFloat(val) : val
    return isNaN(num as number) ? null : num
  },
  z.number().min(0).max(99999.99).nullable()
)

// Helper para slug - trata string vazia
const optionalSlug = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null
    return String(val).trim()
  },
  z.string().max(100).nullable()
)

// Schema de criação de plano
export const createPlanSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  description: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(300, 'Descrição deve ter no máximo 300 caracteres'),
  price: z
    .number()
    .min(0, 'Preço não pode ser negativo')
    .max(9999.99, 'Preço máximo é R$ 9.999,99'),
  // Novos campos para pagamentos
  slug: optionalSlug.optional(),
  priceMonthly: optionalPrice.optional(),
  priceYearly: optionalPrice.optional(),
  priceSingle: optionalPrice.optional(),
  isActive: z.boolean().default(true),
  benefitIds: z.array(z.string()).min(1, 'Selecione pelo menos um benefício'),
})

// Schema de atualização (todos os campos opcionais)
export const updatePlanSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .optional(),
  description: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(300, 'Descrição deve ter no máximo 300 caracteres')
    .optional(),
  price: z
    .number()
    .min(0, 'Preço não pode ser negativo')
    .max(9999.99, 'Preço máximo é R$ 9.999,99')
    .optional(),
  // Novos campos para pagamentos
  slug: optionalSlug.optional(),
  priceMonthly: optionalPrice.optional(),
  priceYearly: optionalPrice.optional(),
  priceSingle: optionalPrice.optional(),
  isActive: z.boolean().optional(),
  benefitIds: z.array(z.string()).optional(),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>

