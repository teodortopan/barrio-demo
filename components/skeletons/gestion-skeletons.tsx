// Suspense fallbacks for /admin/gestion. Match outer card dimensions so the
// layout stays put while heavy data streams in.

function CardShell({
  className = "",
  rows = 0,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    // `flex flex-col` mirrors the real ReclamosFeed/UsuariosTable cards so the
    // inner cream area can `flex-1` to fill the remaining height. Without it
    // the placeholder doesn't align with where the live card paints.
    <div
      className={`bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col overflow-hidden animate-pulse ${className}`}
    >
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-8 h-8 rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70" />
        <div className="h-4 w-40 rounded bg-[#FBF8EF] border border-[#E9E2CE]/70" />
      </div>
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 flex-1 min-h-[120px]" />
      {rows > 0 &&
        Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3 mt-3 rounded bg-[#FBF8EF] border border-[#E9E2CE]/70 shrink-0"
          />
        ))}
    </div>
  );
}

export function ReclamosFeedSkeleton({
  stretchToSibling = true,
}: {
  stretchToSibling?: boolean;
}) {
  if (!stretchToSibling) {
    return (
      <div className="h-[70vh] md:h-[640px]">
        <CardShell className="h-full" />
      </div>
    );
  }

  return (
    <div className="md:relative md:min-h-0">
      <div className="h-[70vh] md:h-auto md:absolute md:inset-0">
        <CardShell className="h-full" />
      </div>
    </div>
  );
}

export function UsuariosTableSkeleton() {
  return <CardShell className="h-[560px]" />;
}
