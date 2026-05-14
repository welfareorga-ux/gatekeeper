import { Skeleton } from "@/components/ui/skeleton"

export default function VigilanteLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background px-4 pt-16 space-y-6">
      <div className="w-full max-w-lg space-y-4">
        <Skeleton className="h-[100px] w-full rounded-xl" />
        <Skeleton className="h-[70px] w-full rounded-xl" />
      </div>
    </div>
  )
}
