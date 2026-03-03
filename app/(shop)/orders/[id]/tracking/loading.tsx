import { Skeleton } from "@/components/ui/skeleton";

export default function TrackingLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back button skeleton */}
      <Skeleton className="mb-4 h-8 w-32" />

      {/* Map skeleton */}
      <div className="relative overflow-hidden rounded-lg border">
        <Skeleton className="h-[500px] w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading delivery tracking...
          </p>
        </div>
      </div>

      {/* Info bar skeleton */}
      <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
