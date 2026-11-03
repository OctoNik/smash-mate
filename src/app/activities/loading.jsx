export default function ActivitiesLoading() {
  return <main className="shell py-10" role="status" aria-label="Memuat aktivitas">
    <div className="h-4 w-28 animate-pulse rounded bg-court-cream" />
    <div className="mt-4 h-10 max-w-sm animate-pulse rounded bg-court-cream" />
    <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => <div key={item} className="dashboard-card h-64 animate-pulse p-6"><div className="h-6 w-20 rounded bg-court-cream" /><div className="mt-6 h-6 w-3/4 rounded bg-court-cream" /><div className="mt-5 h-4 w-full rounded bg-court-cream" /><div className="mt-3 h-4 w-2/3 rounded bg-court-cream" /></div>)}
    </div>
    <span className="sr-only">Memuat aktivitas...</span>
  </main>;
}
