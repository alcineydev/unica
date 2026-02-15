import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] space-y-0 animate-in fade-in duration-300">
      {/* Hero skeleton mobile */}
      <div className="lg:hidden">
        <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#0a1628] px-5 pt-4 pb-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
          </div>
          <Skeleton className="h-3 w-24 bg-white/10 mb-2" />
          <Skeleton className="h-8 w-36 bg-white/10 mb-5" />
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        </div>
        <div className="h-4 bg-gradient-to-b from-[#0a1628] to-[#f8fafc] rounded-b-[16px]" />
      </div>

      {/* Hero skeleton desktop */}
      <div className="hidden lg:block">
        <div className="bg-white border-b border-gray-200 px-10 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-9 w-40 mb-6" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
            <Skeleton className="h-24 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="px-4 sm:px-6 lg:px-10 mt-4 space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-28 lg:h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
