export default function Loading() {
  return (
    <div className="min-h-screen bg-[#E9E7E1]">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6 animate-pulse">
        <div className="h-10 w-56 bg-black/5 rounded-[14px] mx-auto mb-3" />
        <div className="h-4 w-72 bg-black/5 rounded mx-auto mb-10" />
        <div className="space-y-4">
          <div className="h-40 bg-white/70 rounded-[14px] border border-black/5" />
          <div className="h-40 bg-white/70 rounded-[14px] border border-black/5" />
        </div>
      </div>
    </div>
  );
}
