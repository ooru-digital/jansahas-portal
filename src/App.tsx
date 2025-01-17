import React, { useState } from 'react';
import { Lock, Mail, LogIn, Users, Building2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import * as auth from './api/auth';
import Dashboard from './components/Dashboard';
import WorkerManagement from './components/WorkerManagement';

type UserType = 'jansathi' | 'construction';
type ActiveView = 'dashboard' | 'workers';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('tokens'));
  const [userType, setUserType] = useState<UserType>('jansathi');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
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
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(errorMessage);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Jansahas Portal</h1>
                </div>
                <div className="ml-6 flex space-x-4">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                      activeView === 'dashboard'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveView('workers')}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                      activeView === 'workers'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Workers
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    localStorage.removeItem('tokens');
                    setIsAuthenticated(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {activeView === 'dashboard' ? <Dashboard /> : <WorkerManagement />}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Jansahas Portal</h1>

            <div className="flex border-b mb-6">
              <button
                onClick={() => setUserType('jansathi')}
                className={`flex-1 p-4 text-center ${
                  userType === 'jansathi'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="inline-block mr-2 h-5 w-5" />
                Jansathi
              </button>
              <button
                onClick={() => setUserType('construction')}
                className={`flex-1 p-4 text-center ${
                  userType === 'construction'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building2 className="inline-block mr-2 h-5 w-5" />
                Construction
              </button>
            </div>

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
      <Toaster position="top-right" />
    </>
  );
}