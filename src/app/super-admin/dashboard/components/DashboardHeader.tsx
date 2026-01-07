interface DashboardHeaderProps {
  onLogout: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-linear-to-r from-gray-900 via-green-900 to-blue-900 backdrop-blur-md shadow-2xl border-b border-green-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <img src="/logo/logo.png" alt="BookMyFutsal" className="h-12 w-12 rounded-lg shadow-lg ring-2 ring-green-400/50" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-lg animate-pulse"></div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">BookMy</span>
              <span className="text-white">Futsal</span>
            </h1>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="bg-linear-to-r from-red-500 to-red-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-400/30 hover:border-red-400/50"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}