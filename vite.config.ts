import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { sentryVitePlugin } from "@sentry/vite-plugin"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [
      react(),
      sentryVitePlugin({
        org: env.VITE_SENTRY_ORG,
        project: env.VITE_SENTRY_PROJECT,
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
      }),
    ],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    build: {
      sourcemap: true, // Required for Sentry
    },
  }
})