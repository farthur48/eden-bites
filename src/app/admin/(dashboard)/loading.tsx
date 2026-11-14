export default function AdminLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-brand-green/10" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-brand-green/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-[1.25rem] border border-border/70 bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[1.25rem] border border-border/70 bg-white" />
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}
