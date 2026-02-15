import { Skeleton } from '@/components/ui/skeleton'

export default function ParceirosLoading() {
  return (
    <div className="px-4 pt-4 lg:px-10 lg:pt-8 space-y-4 animate-in fade-in duration-300">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Search */}
      <Skeleton className="h-11 w-full rounded-xl" />

      {/* Filter pills */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
