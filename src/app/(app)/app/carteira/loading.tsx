import { Skeleton } from '@/components/ui/skeleton'

export default function CarteiraLoading() {
  return (
    <div className="px-4 pt-4 lg:px-10 lg:pt-8 space-y-6">
      {/* QR Card */}
      <div className="flex justify-center">
        <Skeleton className="h-64 w-64 rounded-2xl" />
      </div>

      {/* Info */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  )
}
