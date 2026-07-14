// Skeleton placeholders for the Caja page Suspense boundaries. Match the
// outer card dimensions so the layout doesn't shift when real data swaps in.

function CardShell({ height = "h-[560px]" }: { height?: string }) {
  return (
    <div
      className={`bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 ${height} animate-pulse`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70" />
        <div className="h-4 w-40 rounded bg-[#FBF8EF] border border-[#E9E2CE]/70" />
      </div>
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 h-full" />
    </div>
  );
}

export function CajaTablesSkeleton() {
  return (
    <div className="flex flex-col gap-6 min-w-0">
      <CardShell height="h-[560px]" />
      <CardShell height="h-[560px]" />
    </div>
  );
}

export function CajaResumenChartsSkeleton() {
  return (
    <div className="flex flex-col gap-6 min-w-0">
      <CardShell height="h-[320px]" />
      <CardShell height="h-[760px]" />
    </div>
  );
}
