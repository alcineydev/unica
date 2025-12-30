import { revalidatePath } from 'next/cache'

/**
 * Revalidar cache de parceiros
 * Usar após criar/editar/deletar parceiro
 */
export async function revalidateParceiros() {
  revalidatePath('/app', 'layout')
  revalidatePath('/app/parceiros', 'page')
  revalidatePath('/admin/parceiros', 'page')
}

/**
 * Revalidar cache de categorias
 * Usar após criar/editar/deletar categoria
 */
export async function revalidateCategorias() {
  revalidatePath('/app', 'layout')
  revalidatePath('/app/categorias', 'page')
  revalidatePath('/admin/categorias', 'page')
}

/**
 * Revalidar cache de planos
 * Usar após criar/editar/deletar plano
 */
export async function revalidatePlanos() {
  revalidatePath('/planos', 'page')
  revalidatePath('/checkout', 'page')
  revalidatePath('/admin/planos', 'page')
}

/**
 * Revalidar cache de cidades
 * Usar após criar/editar/deletar cidade
 */
export async function revalidateCidades() {
  revalidatePath('/app', 'layout')
  revalidatePath('/admin/cidades', 'page')
}

/**
 * Revalidar cache de benefícios
 * Usar após criar/editar/deletar benefício
 */
export async function revalidateBeneficios() {
  revalidatePath('/app', 'layout')
  revalidatePath('/admin/beneficios', 'page')
  revalidatePath('/admin/planos', 'page')
}

/**
 * Revalidar cache de configurações
 * Usar após alterar configurações do sistema
 */
export async function revalidateConfig() {
  revalidatePath('/', 'layout')
}

/**
 * Revalidar cache de páginas
 * Usar após criar/editar/deletar página
 */
export async function revalidatePages() {
  revalidatePath('/', 'layout')
}

/**
 * Revalidar tudo (usar com cuidado)
 */
export async function revalidateAll() {
  revalidatePath('/', 'layout')
}
