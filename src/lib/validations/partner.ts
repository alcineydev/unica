import { z } from 'zod'

// Schema de criação de parceiro (completo pelo admin)
export const createPartnerSchema = z.object({
  // Dados do usuário
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  
  // Dados da empresa
  companyName: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  tradeName: z.string().optional(),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  category: z.string().min(1, 'Selecione uma categoria'),
  description: z.string().optional(),
  
  // Localização
  cityId: z.string().min(1, 'Selecione uma cidade'),
  
  // Contato
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  phone: z.string().optional(),
  
  // Status
  isActive: z.boolean().default(true),
})

// Schema de atualização (sem email/senha/cnpj)
export const updatePartnerSchema = z.object({
  companyName: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres').optional(),
  tradeName: z.string().optional().nullable(),
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  cityId: z.string().optional(),
  whatsapp: z.string().min(10, 'WhatsApp inválido').optional(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>

