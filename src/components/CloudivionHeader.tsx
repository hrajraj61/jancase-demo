import Image from "next/image";
import Link from "next/link";

export function CloudivionHeader() {
  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and branding */}
          <div className="flex items-center gap-4">
            <Link 
              href="https://www.cloudivion.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="https://www.cloudivion.com/images/cloudivion-logo.png"
                alt="Cloudivion Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
            <div className="h-6 w-px bg-slate-600 hidden sm:block" />
            <div className="hidden sm:flex flex-col">
              <p className="text-sm font-medium text-white">JanCase Hazaribagh</p>
              <p className="text-xs text-slate-400">POC by Cloudivion</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Report Issue
            </Link>
            <Link 
              href="/dashboard" 
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/mayor" 
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Mayor View
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}