import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "credissuer",
      project: "worker-registry-ui",
      authToken: "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",
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: true // Required for Sentry
  }
});