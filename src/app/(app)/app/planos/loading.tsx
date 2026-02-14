import { Skeleton } from '@/components/ui/skeleton'

export default function PlanosLoading() {
  return (
    <div className="px-4 pt-4 lg:px-10 lg:pt-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Plano atual */}
      <Skeleton className="h-32 rounded-2xl bg-gray-200" />

      {/* Outros planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
