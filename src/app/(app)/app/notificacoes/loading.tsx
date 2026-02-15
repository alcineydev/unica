import { Skeleton } from '@/components/ui/skeleton'

export default function NotificacoesLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 pt-4 lg:px-10 lg:pt-8 space-y-4 animate-in fade-in duration-300">
      <Skeleton className="h-7 w-36" />
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}
