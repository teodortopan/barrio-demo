// Suspense fallbacks for the resident /dashboard page.

function CardShell({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 animate-pulse ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-4 w-40 rounded bg-[#FBF8EF] border border-[#E9E2CE]/70" />
      </div>
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 h-full min-h-[160px] flex-1" />
    </div>
  );
}

export function CuentaCorrienteSkeleton() {
  return <CardShell className="h-[480px]" />;
}

export function MiGestionSkeleton() {
  return <CardShell className="h-[480px]" />;
}
