import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPage(slug: string) {
  const page = await prisma.page.findFirst({
    where: {
      slug: { equals: slug, mode: 'insensitive' },
      isPublished: true
    }
  })
  return page
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return {
      title: 'Página não encontrada'
    }
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined
  }
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header simples */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
            {page.title}
          </h1>

          <div
            className="prose prose-zinc dark:prose-invert max-w-none
              prose-headings:text-zinc-900 dark:prose-headings:text-white
              prose-p:text-zinc-700 dark:prose-p:text-zinc-300
              prose-a:text-red-600 dark:prose-a:text-red-400
              prose-strong:text-zinc-900 dark:prose-strong:text-white
              prose-ul:text-zinc-700 dark:prose-ul:text-zinc-300
              prose-ol:text-zinc-700 dark:prose-ol:text-zinc-300
              prose-li:text-zinc-700 dark:prose-li:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </article>
      </main>

      {/* Footer simples */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
          <p>&copy; {new Date().getFullYear()} UNICA - Clube de Benefícios</p>
        </div>
      </footer>
    </div>
  )
}
