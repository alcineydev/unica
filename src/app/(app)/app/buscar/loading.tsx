import { Skeleton } from '@/components/ui/skeleton'

export default function BuscarLoading() {
  return (
    <div className="px-4 pt-4 lg:px-10 lg:pt-8 space-y-4">
      {/* Search */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Recent searches */}
      <Skeleton className="h-5 w-32" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Results */}
      <Skeleton className="h-5 w-28 mt-4" />
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}
