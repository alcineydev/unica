import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

/**
 * Cache de parceiros ativos
 * Revalida a cada 5 minutos
 */
export const getCachedParceiros = unstable_cache(
  async (cityId?: string, categoryId?: string) => {
    return await prisma.parceiro.findMany({
      where: {
        isActive: true,
        ...(cityId && { cityId }),
        ...(categoryId && { categoryId }),
      },
      include: {
        categoryRef: true,
        city: true,
        benefitAccess: {
          include: { benefit: true }
        },
        avaliacoes: {
          where: { publicada: true },
          select: { nota: true }
        }
      },
      orderBy: { tradeName: 'asc' }
    })
  },
  ['parceiros'],
  { revalidate: 300 }
)

/**
 * Cache de parceiros em destaque
 * Revalida a cada 5 minutos
 */
export const getCachedParceirosDestaque = unstable_cache(
  async () => {
    return await prisma.parceiro.findMany({
      where: {
        isActive: true,
        isDestaque: true,
      },
      include: {
        categoryRef: true,
        city: true,
      },
      orderBy: { destaqueOrder: 'asc' },
      take: 10
    })
  },
  ['parceiros-destaque'],
  { revalidate: 300 }
)

/**
 * Cache de categorias ativas
 * Revalida a cada 1 hora
 */
export const getCachedCategorias = unstable_cache(
  async () => {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { parceiros: true }
        }
      }
    })
  },
  ['categorias'],
  { revalidate: 3600 }
)

/**
 * Cache de cidades ativas
 * Revalida a cada 1 hora
 */
export const getCachedCidades = unstable_cache(
  async () => {
    return await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  },
  ['cidades'],
  { revalidate: 3600 }
)

/**
 * Cache de planos ativos
 * Revalida a cada 10 minutos
 */
export const getCachedPlanos = unstable_cache(
  async () => {
    return await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      include: {
        planBenefits: {
          include: { benefit: true }
        }
      }
    })
  },
  ['planos'],
  { revalidate: 600 }
)

/**
 * Cache de benefícios ativos
 * Revalida a cada 10 minutos
 */
export const getCachedBeneficios = unstable_cache(
  async () => {
    return await prisma.benefit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  },
  ['beneficios'],
  { revalidate: 600 }
)

/**
 * Cache de configurações do sistema
 * Revalida a cada 30 minutos
 */
export const getCachedSystemConfig = unstable_cache(
  async (category?: string) => {
    return await prisma.systemConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: 'asc' }
    })
  },
  ['system-config'],
  { revalidate: 1800 }
)

/**
 * Cache de páginas publicadas
 * Revalida a cada 1 hora
 */
export const getCachedPages = unstable_cache(
  async () => {
    return await prisma.page.findMany({
      where: { isPublished: true },
      orderBy: { footerOrder: 'asc' }
    })
  },
  ['pages'],
  { revalidate: 3600 }
)
