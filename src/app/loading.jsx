export default function Loading() {
  return (
    <main className="dashboard-shell grid min-h-screen place-items-center px-6">
      <div className="loading-panel" role="status" aria-live="polite">
        <span className="loading-shuttle" aria-hidden="true">🏸</span>
        <h1>Memuat halaman</h1>
        <p>Mohon tunggu sebentar...</p>
        <span className="loading-track" aria-hidden="true"><span /></span>
      </div>
    </main>
  );
}
