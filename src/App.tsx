import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import WorkerDetails from './pages/WorkerDetails';
import Approvals from './pages/Approvals';
import AddWorker from './pages/AddWorker';
import BulkUpload from './pages/BulkUpload';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('tokens'));

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout isAuthenticated={isAuthenticated} />}>
          <Route 
            path="/login" 
            element={<Login onLogin={() => setIsAuthenticated(true)} />} 
          />
        </Route>

        {/* Protected routes */}
        <Route 
          element={
            <DashboardLayout 
              isAuthenticated={isAuthenticated} 
              onLogout={() => setIsAuthenticated(false)} 
            />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/workers/:workerId" element={<WorkerDetails />} />
          <Route path="/workers/add-worker" element={<AddWorker />} />
          <Route path="/workers/add-in-bulk" element={<BulkUpload />} />
          <Route path="/approvals" element={<Approvals />} />
        </Route>

        {/* Redirect all other routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
      
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
    </Router>
  );
}