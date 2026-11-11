import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

// Same rules as admin-vite/eslint.config.js.
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Capitalised names are components used as JSX (<Icon />), and `motion`
      // is used as <motion.div>; core ESLint doesn't count JSX as a use.
      // motion / m: used only as JSX namespaces (<m.div>), which this rule can't see.
      'no-unused-vars': ['error', { varsIgnorePattern: '^([A-Z_]|motion$|m$)', argsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Contexts export their use… hook, and the button module its class helper.
    // This rule only affects hot reload in development, so these established
    // modules are exempt; new files still get it.
    files: [
      'src/components/ui/button.jsx',
      'src/context/AuthContext.jsx',
      'src/context/TripContext.jsx',
      'src/context/VibeProfileContext.jsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Build tooling (Vite config, the SEO plugin) runs in Node; middleware.js
    // runs on Vercel's edge runtime, which also provides `process.env`.
    files: ['vite.config.js', 'seo/**/*.js', 'middleware.js', '**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
]);
