// Temporarily simplified to test basic functionality
// import { ReportForm } from "@/components/ReportForm";

export default function HomePage() {
  return (
    <main className="min-h-screen px-3 py-3 text-white sm:px-5 sm:py-5 lg:px-6 lg:py-6" style={{ backgroundColor: "#0f172a" }}>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">🏛️ JanCase Hazaribagh</h1>
        <p className="text-gray-300 mb-6">Civic issue reporting platform</p>
        
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <p className="text-sm">✅ App is loading successfully!</p>
          <p className="text-xs text-gray-400 mt-2">This is a simplified version for debugging.</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <a href="/test" className="block text-blue-400 hover:text-blue-300">→ Test Page</a>
          <a href="/api/debug" className="block text-blue-400 hover:text-blue-300">→ Debug API</a>
          <a href="/dashboard" className="block text-blue-400 hover:text-blue-300">→ Dashboard</a>
        </div>
      </div>
    </main>
  );
}
