import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in development
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/staging-jansahas\.credissuer\.com/
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample rate for session replays
  replaysOnErrorSampleRate: 1.0, // Sample rate for replays when errors occur
  environment: import.meta.env.MODE, // Set environment based on Vite mode
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// Error Fallback Component
function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">
          {error?.message || "An unexpected error occurred. Our team has been notified."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}