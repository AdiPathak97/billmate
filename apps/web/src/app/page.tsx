export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="card p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-brand-700 mb-2">BillMate</h1>
        <p className="text-gray-500 text-sm mb-6">
          GST-compliant invoicing for Indian small businesses
        </p>
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          Phase 0 scaffold — API and DB wiring in progress.
        </div>
      </div>
    </main>
  );
}
