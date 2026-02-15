import { Skeleton } from '@/components/ui/skeleton'

export default function CategoriaLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 pt-4 lg:px-10 lg:pt-8 space-y-4 animate-in fade-in duration-300">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
