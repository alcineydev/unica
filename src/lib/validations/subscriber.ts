import { z } from 'zod'

// Todos os status de assinatura possíveis
const subscriptionStatusEnum = z.enum([
  'PENDING', 
  'ACTIVE', 
  'SUSPENDED', 
  'CANCELED',
  'INACTIVE',
  'EXPIRED'
])

// Schema de criação de assinante (pelo admin)
export const createSubscriberSchema = z.object({
  // Dados do usuário
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  
  // Dados pessoais
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  
  // Localização e plano
  cityId: z.string().min(1, 'Selecione uma cidade'),
  planId: z.string().min(1, 'Selecione um plano'),
  
  // Status
  subscriptionStatus: subscriptionStatusEnum.default('ACTIVE'),
})

// Schema de atualização (sem email/senha/cpf)
export const updateSubscriberSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  cityId: z.string().nullable().optional(),
  planId: z.string().nullable().optional(),
  subscriptionStatus: subscriptionStatusEnum.optional(),
  points: z.number().min(0).optional(),
  cashback: z.number().min(0).optional(),
})

export type CreateSubscriberInput = z.infer<typeof createSubscriberSchema>
export type UpdateSubscriberInput = z.infer<typeof updateSubscriberSchema>

