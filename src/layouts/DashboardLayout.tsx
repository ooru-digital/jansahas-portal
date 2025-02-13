import { useState, useEffect } from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { Home, Users, CheckSquare, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import Footer from '../components/Footer';

interface DashboardLayoutProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface UserInfo {
  name: string;
  email: string;
  is_jansathi: boolean;
  profile_photo?: string | null;
  organization_name: string;
  organization_logo: string;
}

export default function DashboardLayout({ isAuthenticated, onLogout }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  useEffect(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      setUserInfo(JSON.parse(userInfoStr));
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('tokens');
    localStorage.removeItem('userInfo');
    onLogout();
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Workers', path: '/workers', icon: Users },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare },
  ];

  const renderUserAvatar = () => {
    if (userInfo?.profile_photo) {
      return (
        <img 
          src={userInfo.profile_photo}
          alt={userInfo.name}
          className="h-8 w-8 rounded-full object-contain border border-gray-300 shadow-sm"
        />
      );
    }
    
    return (
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
        {userInfo?.name ? getInitials(userInfo.name) : ''}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-3">
            {userInfo?.organization_logo ? (
              <div className="flex items-center gap-3">
                <img 
                  src={userInfo.organization_logo} 
                  alt={userInfo.organization_name}
                  className="h-12 w-12 rounded-full object-contain border-2 border-gray-200 p-1"
                />
                <span className="text-xl font-semibold text-gray-900 truncate">
                  {userInfo.is_jansathi ? 'Worker Registry' : userInfo.organization_name}
                </span>
              </div>
            ) : (
              <span className="text-xl font-semibold text-gray-900">
                {userInfo?.organization_name}
              </span>
            )}
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 mr-3" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="relative">
              <button
                onClick={() => setShowLogout(!showLogout)}
                className="w-full group flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                {renderUserAvatar()}
                <div className="flex-1 text-left ml-2">
                  <p className="text-base font-medium">{userInfo?.name}</p>
                  <p className="text-xs text-gray-500">{userInfo?.email}</p>
                </div>
                <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${showLogout ? 'rotate-180' : ''}`} />
              </button>
              
              {showLogout && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button and header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-600 p-2 -ml-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            {userInfo?.organization_logo ? (
              <div className="flex items-center gap-3 ml-2">
                <img 
                  src={userInfo.organization_logo} 
                  alt={userInfo.organization_name}
                  className="h-10 w-10 rounded-full object-contain border-2 border-gray-200 p-1"
                />
                <span className="text-lg font-semibold text-gray-900 truncate">
                  {userInfo.organization_name}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-gray-900 ml-2">
                {userInfo?.organization_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                {userInfo?.organization_logo ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={userInfo.organization_logo} 
                      alt={userInfo.organization_name}
                      className="h-10 w-10 rounded-full object-contain border-2 border-gray-200 p-1"
                    />
                    <span className="text-lg font-semibold text-gray-900 truncate">
                      {userInfo.organization_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-gray-900">
                    {userInfo?.organization_name}
                  </span>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-600 p-2"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5 flex-shrink-0 mr-3" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="relative">
                  <button
                    onClick={() => setShowLogout(!showLogout)}
                    className="w-full group flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                  >
                    {renderUserAvatar()}
                    <div className="flex-1 text-left ml-2">
                      <p className="text-base font-medium">{userInfo?.name}</p>
                      <p className="text-xs text-gray-500">{userInfo?.email}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${showLogout ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showLogout && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-5 w-5 flex-shrink-0 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="pt-16 md:pt-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-16">
              <Outlet />
            </div>
          </div>
        </main>
        <div className="md:pl-0">
          <Footer />
        </div>
      </div>
    </div>
  );
}