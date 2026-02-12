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
  category: z.string().optional().default('Geral'),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional(),

  // Imagens
  logo: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional(),

  // Localização
  cityId: z.string().optional(),

  // Endereço detalhado
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  complement: z.string().optional(),
  zipCode: z.string().optional(),

  // Contato
  whatsapp: z.string().optional().default(''),
  phone: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),

  // Benefícios
  benefitIds: z.array(z.string()).optional(),

  // Status
  isActive: z.boolean().default(true),

  // Destaque
  isDestaque: z.boolean().optional(),
  bannerDestaque: z.string().nullable().optional(),
  destaqueOrder: z.number().optional(),
})

// Schema de atualização (sem email/senha/cnpj)
export const updatePartnerSchema = z.object({
  companyName: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres').optional(),
  tradeName: z.string().optional().nullable(),
  category: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),

  // Imagens
  logo: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional(),

  // Localização
  cityId: z.string().optional(),

  // Endereço detalhado
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  complement: z.string().optional(),
  zipCode: z.string().optional(),

  // Contato
  whatsapp: z.string().min(10, 'WhatsApp inválido').optional(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),

  // Benefícios
  benefitIds: z.array(z.string()).optional(),

  isActive: z.boolean().optional(),

  // Destaque
  isDestaque: z.boolean().optional(),
  bannerDestaque: z.string().nullable().optional(),
  destaqueOrder: z.number().optional(),
})

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>

