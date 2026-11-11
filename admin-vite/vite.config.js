import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// The deployed commit tags error reports (Vercel sets VERCEL_GIT_COMMIT_SHA at
// build time; Vite only exposes VITE_* variables to the app).
process.env.VITE_RELEASE ||= process.env.VERCEL_GIT_COMMIT_SHA || '';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Vitest: src/**/*.test.{js,jsx}; component tests opt into jsdom per file.
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
