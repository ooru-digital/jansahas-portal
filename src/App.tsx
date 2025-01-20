import React, { useState } from 'react';
import { Lock, Mail, LogIn, Home, Users, ClipboardCheck, LogOut, Menu, X, CheckSquare } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import * as auth from './api/auth';
import Dashboard from './components/Dashboard';
import WorkerManagement from './components/WorkerManagement';
import Approvals from './components/Approvals';

type ActiveView = 'dashboard' | 'workers' | 'approvals';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('tokens'));
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tokens = await auth.login({
        email: formData.email,
        password: formData.password,
      });
      toast.success('Login successful!');
      localStorage.setItem('tokens', JSON.stringify(tokens));
      setIsAuthenticated(true);
    } catch (error) {
      // Error will be handled by axios interceptor
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tokens');
    setIsAuthenticated(false);
  };

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'workers':
        return <WorkerManagement />;
      case 'approvals':
        return <Approvals />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      {isAuthenticated ? (
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar for desktop */}
          <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Jansahas Portal</h1>
              </div>
              <div className="mt-8 flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                      activeView === 'dashboard'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Home className="mr-3 h-5 w-5" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigate('workers')}
                    className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                      activeView === 'workers'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    Workers
                  </button>
                  <button
                    onClick={() => handleNavigate('approvals')}
                    className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                      activeView === 'approvals'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CheckSquare className="mr-3 h-5 w-5" />
                    Approvals
                  </button>
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <button
                  onClick={handleLogout}
                  className="group flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md w-full"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-3">
              <h1 className="text-xl font-bold text-gray-900">Jansahas Portal</h1>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-600"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
              <div className="fixed inset-y-0 left-0 w-64 bg-white">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Jansahas Portal</h1>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-gray-500 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <nav className="flex-1 px-2 py-4 space-y-1">
                    <button
                      onClick={() => handleNavigate('dashboard')}
                      className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                        activeView === 'dashboard'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Home className="mr-3 h-5 w-5" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleNavigate('workers')}
                      className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                        activeView === 'workers'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="mr-3 h-5 w-5" />
                      Workers
                    </button>
                    <button
                      onClick={() => handleNavigate('approvals')}
                      className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                        activeView === 'approvals'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <CheckSquare className="mr-3 h-5 w-5" />
                      Approvals
                    </button>
                  </nav>
                  <div className="flex-shrink-0 border-t border-gray-200 p-4">
                    <button
                      onClick={handleLogout}
                      className="group flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md w-full"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="md:pl-64 flex flex-col flex-1">
            <main className="flex-1">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                  {renderContent()}
                </div>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Jansahas Portal</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                      placeholder="Enter your email"
                      required
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                      placeholder="Enter your password"
                      required
                    />
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="h-5 w-5" />
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}