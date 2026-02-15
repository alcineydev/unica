import { Skeleton } from '@/components/ui/skeleton'

export default function CategoriasLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 pt-4 lg:px-10 lg:pt-8 space-y-4 animate-in fade-in duration-300">
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
