import { z } from 'zod'

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
  isActive: z.boolean().optional(),
  benefitIds: z.array(z.string()).optional(),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>

