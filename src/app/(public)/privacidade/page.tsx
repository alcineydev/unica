import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Política de Privacidade' }

export default async function PrivacidadePage() {
    const page = await prisma.legalPage.findUnique({
        where: { slug: 'politica-de-privacidade' },
    })

    if (!page || !page.isActive) return notFound()

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
                    <div className="prose prose-sm sm:prose max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
                    <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
                        <p>Versão {page.version} • Atualizado em {page.updatedAt.toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
