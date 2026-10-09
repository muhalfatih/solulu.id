export default function RootLoading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-muted/40 overflow-hidden">
      <div className="h-full w-full bg-purple-600 animate-[shimmer_1.5s_infinite_linear] origin-left" />
    </div>
  )
}
