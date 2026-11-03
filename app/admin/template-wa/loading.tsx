import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

/** Mengikuti TemplateWaClient: header, lalu satu kartu editor per template. */
export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
