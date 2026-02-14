import { Skeleton } from '@/components/ui/skeleton'

export default function AutomacoesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  )
}
