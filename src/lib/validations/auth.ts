import { z } from 'zod'

/**
 * Validação de CPF (algoritmo do módulo 11)
 */
function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false // Todos dígitos iguais

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(10))) return false

  return true
}

/**
 * Validação de CNPJ (algoritmo do módulo 11)
 */
function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false // Todos dígitos iguais

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights1[i]
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cnpj.charAt(12))) return false

  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  if (digit2 !== parseInt(cnpj.charAt(13))) return false

  return true
}

/**
 * Schema de registro de assinante
 */
export const registerAssinanteSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),
  cpf: z
    .string()
    .length(11, 'CPF deve ter 11 dígitos')
    .regex(/^\d+$/, 'CPF deve conter apenas números')
    .refine(isValidCPF, 'CPF inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

/**
 * Schema de registro de parceiro
 */
export const registerParceiroSchema = z.object({
  companyName: z
    .string()
    .min(3, 'Razão social deve ter no mínimo 3 caracteres')
    .max(200, 'Razão social deve ter no máximo 200 caracteres'),
  tradeName: z
    .string()
    .max(200, 'Nome fantasia deve ter no máximo 200 caracteres')
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números'),
  cnpj: z
    .string()
    .length(14, 'CNPJ deve ter 14 dígitos')
    .regex(/^\d+$/, 'CNPJ deve conter apenas números')
    .refine(isValidCNPJ, 'CNPJ inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

export type RegisterAssinanteInput = z.infer<typeof registerAssinanteSchema>
export type RegisterParceiroInput = z.infer<typeof registerParceiroSchema>

