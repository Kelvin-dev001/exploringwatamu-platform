import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import seoPlugin from './seo/plugin.js';

// The deployed commit tags error reports (Vercel sets VERCEL_GIT_COMMIT_SHA at
// build time; Vite only exposes VITE_* variables to the app).
process.env.VITE_RELEASE ||= process.env.VERCEL_GIT_COMMIT_SHA || '';

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks cache across deploys; app code changes more often.
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', 'axios', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Vitest: unit tests for the pure libraries (src/**/*.test.js).
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
