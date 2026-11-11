// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/*
 * Browser smoke tests for the main journey. Playwright starts three servers:
 *   - the API on an in-memory database (scripts/smoke-api.js)   :5055
 *   - a production build of the website (vite build + preview)  :4173
 *   - a production build of the admin portal                     :4174
 * Both builds point at the local API, so nothing touches production.
 * Install each app first (npm ci in backend/, client-vite/, admin-vite/).
 */
const API = 'http://localhost:5055/api';
const build = (outDir, port) =>
  `npx vite build --outDir ${outDir} --emptyOutDir && npx vite preview --outDir ${outDir} --port ${port} --strictPort`;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node scripts/smoke-api.js',
      url: `${API}/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
    },
    {
      command: build('../e2e/.out/site', 4173),
      cwd: '../client-vite',
      // A placeholder business number, so the WhatsApp buttons render (links are checked, never followed).
      env: { VITE_API_URL: API, VITE_WHATSAPP_NUMBER: '+254 700 000 000' },
      url: 'http://localhost:4173',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: build('../e2e/.out/admin', 4174),
      cwd: '../admin-vite',
      env: { VITE_API_URL: API },
      url: 'http://localhost:4174/admin/login',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
