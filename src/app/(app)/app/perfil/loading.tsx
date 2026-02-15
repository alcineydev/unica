import { Skeleton } from '@/components/ui/skeleton'

export default function PerfilLoading() {
  return (
    <div className="px-4 pt-4 lg:px-10 lg:pt-8 space-y-6 animate-in fade-in duration-300">
      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Form sections */}
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}
