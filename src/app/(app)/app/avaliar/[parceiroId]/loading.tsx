import { Skeleton } from '@/components/ui/skeleton'

export default function AvaliarLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 pt-4 lg:px-10 lg:pt-8 space-y-6 animate-in fade-in duration-300">
      {/* Parceiro info */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-10 w-10 rounded-lg" />
        ))}
      </div>

      {/* Comment */}
      <Skeleton className="h-32 rounded-xl" />

      {/* Button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}
