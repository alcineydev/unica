import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-[#f8fafc] border-b p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      <div className="container py-4 space-y-4">
        {/* Search skeleton */}
        <Skeleton className="h-10 w-full rounded-lg" />

        {/* Categories filter skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-4 w-40" />

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden bg-white">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
