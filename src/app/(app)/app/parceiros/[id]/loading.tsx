import { Skeleton } from '@/components/ui/skeleton'

export default function ParceiroDetailLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Banner */}
      <Skeleton className="h-48 lg:h-56 w-full" />

      <div className="px-4 lg:px-10 -mt-8 relative space-y-4">
        {/* Logo + Info */}
        <div className="flex items-end gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl border-4 border-white" />
          <div className="space-y-2 pb-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        {/* Benefits */}
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
