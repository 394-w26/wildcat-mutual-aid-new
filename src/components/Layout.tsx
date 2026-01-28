import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utilities/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  unreadCount?: number;
  onCreateRequest?: () => void;
}

export default function Layout({ children, unreadCount = 0, onCreateRequest }: LayoutProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-4 text-center">
              How to use Wildcat Help
            </h2>
            <div className="space-y-4 text-gray-700">
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <span>
                    <strong>Create a request</strong> using the + button to ask for help from fellow Wildcats
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <span>
                    <strong>Browse requests</strong> and offer help to students who need it
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <span>
                    <strong>Check notifications</strong> when someone offers to help you
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</span>
                  <span>
                    <strong>Accept offers</strong> to connect and coordinate with your helper
                  </span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 bg-purple-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-800 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-purple-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="text-left">
            <h1 className="text-xl font-bold text-white">Wildcat Help</h1>
            <p className="text-xs text-purple-200">Northwestern University</p>
          </button>

          <div className="flex gap-3 items-center">
            {/* Create Request Button */}
            {onCreateRequest && (
              <button
                onClick={onCreateRequest}
                className="bg-white text-purple-900 px-4 py-2 rounded-xl hover:bg-purple-100 transition-colors font-semibold flex items-center gap-2"
                title="Create request"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="hidden sm:inline">New Request</span>
              </button>
            )}

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-colors"
              >
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <svg className={`w-4 h-4 text-white transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 truncate">{currentUser?.displayName}</p>
                    <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/profile-settings'); setShowUserMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </button>
                  <button
                    onClick={() => { setShowHelp(true); setShowUserMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help
                  </button>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive('/dashboard') ? 'text-purple-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className={`text-xs mt-1 font-medium ${isActive('/dashboard') ? 'text-purple-900' : ''}`}>Home</span>
              {isActive('/dashboard') && <div className="w-1 h-1 bg-purple-900 rounded-full mt-1" />}
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors relative ${
                isActive('/notifications') ? 'text-purple-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive('/notifications') ? 'text-purple-900' : ''}`}>Notifications</span>
              {isActive('/notifications') && <div className="w-1 h-1 bg-purple-900 rounded-full mt-1" />}
            </button>

            <button
              onClick={() => navigate('/profile-settings')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive('/profile-settings') ? 'text-purple-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className={`text-xs mt-1 font-medium ${isActive('/profile-settings') ? 'text-purple-900' : ''}`}>Profile</span>
              {isActive('/profile-settings') && <div className="w-1 h-1 bg-purple-900 rounded-full mt-1" />}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
