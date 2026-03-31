import Link from "next/link";

export function CloudivionFooter() {
  return (
    <footer className="bg-slate-900/50 border-t border-slate-800/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>©</span>
            <span>{new Date().getFullYear()}</span>
            <Link 
              href="https://www.cloudivion.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors font-medium"
            >
              Cloudivion
            </Link>
            <span className="hidden sm:inline">- AI-driven civic solutions</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>JanCase Hazaribagh</span>
            <span className="hidden sm:inline">Proof of Concept</span>
          </div>
        </div>
      </div>
    </footer>
  );
}