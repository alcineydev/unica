import { Skeleton } from '@/components/ui/skeleton'

export default function AssinantesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Table */}
      <Skeleton className="h-12 rounded-lg" />
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-14 rounded-lg" />
      ))}
    </div>
  )
}
