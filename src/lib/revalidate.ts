import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Revalidar cache de parceiros
 * Usar após criar/editar/deletar parceiro
 */
export async function revalidateParceiros() {
  revalidateTag('parceiros')
  revalidatePath('/app')
  revalidatePath('/app/parceiros')
}

/**
 * Revalidar cache de categorias
 * Usar após criar/editar/deletar categoria
 */
export async function revalidateCategorias() {
  revalidateTag('categorias')
  revalidatePath('/app')
}

/**
 * Revalidar cache de planos
 * Usar após criar/editar/deletar plano
 */
export async function revalidatePlanos() {
  revalidateTag('planos')
  revalidatePath('/planos')
  revalidatePath('/checkout')
}

/**
 * Revalidar cache de cidades
 * Usar após criar/editar/deletar cidade
 */
export async function revalidateCidades() {
  revalidateTag('cidades')
}

/**
 * Revalidar cache de benefícios
 * Usar após criar/editar/deletar benefício
 */
export async function revalidateBeneficios() {
  revalidateTag('beneficios')
  revalidateTag('planos')
}

/**
 * Revalidar cache de configurações
 * Usar após alterar configurações do sistema
 */
export async function revalidateConfig() {
  revalidateTag('config')
}

/**
 * Revalidar cache de páginas
 * Usar após criar/editar/deletar página
 */
export async function revalidatePages() {
  revalidateTag('pages')
}

/**
 * Revalidar tudo (usar com cuidado)
 */
export async function revalidateAll() {
  revalidateTag('parceiros')
  revalidateTag('categorias')
  revalidateTag('planos')
  revalidateTag('cidades')
  revalidateTag('beneficios')
  revalidateTag('config')
  revalidateTag('pages')
}
