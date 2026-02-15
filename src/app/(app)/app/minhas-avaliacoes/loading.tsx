import { Skeleton } from '@/components/ui/skeleton'

export default function AvaliacoesLoading() {
  return (
    <div className="px-4 pt-4 lg:px-10 lg:pt-8 space-y-4 animate-in fade-in duration-300">
      <Skeleton className="h-7 w-40" />
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}
