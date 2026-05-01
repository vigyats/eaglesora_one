import { useLocation } from "wouter";

export function RouteTricolourLoader({ show }: { show: boolean }) {
  const [loc] = useLocation();
  const isAdmin = loc.startsWith("/admin");

  if (!show) return null;

  if (isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ animation: "fadeIn 0.15s ease both" }}>
        {/* Admin top bar */}
        <div className="h-14 w-full border-b border-border flex items-center px-6 gap-4 shrink-0">
          <div className="h-3 w-16 rounded shimmer opacity-30" />
          <div className="w-px h-4 bg-border" />
          <div className="h-6 w-20 rounded shimmer opacity-20" />
          <div className="ml-auto flex gap-2">
            <div className="h-7 w-16 rounded shimmer opacity-20" />
            <div className="h-7 w-20 rounded shimmer opacity-20" />
          </div>
        </div>

        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="hidden lg:flex flex-col w-[200px] border-r border-border p-4 gap-2 shrink-0">
            <div className="h-3 w-12 rounded shimmer opacity-20 mb-2" />
            {[1,2,3,4].map(i => (
              <div key={i} className="h-9 rounded shimmer opacity-15" />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-8 space-y-6">
            <div className="h-6 w-48 rounded shimmer opacity-30" />
            <div className="h-4 w-72 rounded shimmer opacity-20" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded shimmer opacity-20" />)}
            </div>
            <div className="h-48 rounded shimmer opacity-15 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // Public page skeleton
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ animation: "fadeIn 0.15s ease both" }}>
      {/* fake header */}
      <div className="h-12 w-full bg-black flex items-center px-6 gap-6 shrink-0">
        <div className="h-4 w-20 rounded shimmer opacity-30" />
        <div className="flex gap-4 ml-auto">
          <div className="h-3 w-12 rounded shimmer opacity-20" />
          <div className="h-3 w-12 rounded shimmer opacity-20" />
          <div className="h-3 w-12 rounded shimmer opacity-20" />
        </div>
      </div>

      {/* fake hero */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div className="h-16 w-40 rounded shimmer opacity-40" />
        <div className="h-10 w-72 md:w-96 rounded shimmer opacity-30" />
        <div className="h-1 w-10 rounded shimmer opacity-40" />
        <div className="flex flex-col items-center gap-2 w-full max-w-sm">
          <div className="h-4 w-full rounded shimmer opacity-25" />
          <div className="h-4 w-4/5 rounded shimmer opacity-25" />
          <div className="h-4 w-3/5 rounded shimmer opacity-25" />
        </div>
        <div className="flex flex-col items-center gap-2 w-full max-w-xs mt-2">
          <div className="h-3 w-full rounded shimmer opacity-20" />
          <div className="h-3 w-3/4 rounded shimmer opacity-20" />
        </div>
        <div className="h-11 w-52 rounded shimmer opacity-30 mt-4" />
      </div>
    </div>
  );
}
