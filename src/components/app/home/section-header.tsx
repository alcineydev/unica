'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  href?: string
}

export function SectionHeader({ title, href }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
