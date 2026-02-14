import { Skeleton } from '@/components/ui/skeleton'

export default function AssinanteDetailLoading() {
  return (
    <div className="p-6">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Sections */}
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
