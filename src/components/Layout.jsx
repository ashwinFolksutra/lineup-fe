import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Hide navigation on editor page for cleaner interface
  const hideNavigation = location.pathname.startsWith('/editor');

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 text-neutral-100">
      {!hideNavigation && (
        <nav className="bg-surface-800/50 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-xl font-bold text-white">
                  Video Editor
                </Link>
                
                <div className="hidden md:flex space-x-6">
                  <Link
                    to="/projects"
                    className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      location.pathname === '/projects'
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-300 hover:text-white hover:bg-surface-700'
                    }`}
                  >
                    Projects
                  </Link>
                  
                  <Link
                    to="/editor"
                    className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      location.pathname.startsWith('/editor')
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-300 hover:text-white hover:bg-surface-700'
                    }`}
                  >
                    Editor
                  </Link>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* You can add user menu, settings, etc. here */}
                <button className="text-neutral-300 hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <main className={hideNavigation ? 'h-screen' : 'min-h-[calc(100vh-4rem)]'}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 