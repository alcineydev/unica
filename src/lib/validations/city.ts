import { z } from 'zod'

export const createCitySchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (UF)')
    .toUpperCase(),
  isActive: z.boolean().default(true),
})

export const updateCitySchema = createCitySchema.partial()

export type CreateCityInput = z.infer<typeof createCitySchema>
export type UpdateCityInput = z.infer<typeof updateCitySchema>

