import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
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
      // Capitalised names are components used as JSX (<Icon />, <List />), which
      // core ESLint doesn't count as a use — for variables and parameters alike.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Kit modules deliberately export a component together with its hook,
    // helpers or constants (useForm, useToast, VIBES, the catalogue configs).
    // This rule only affects hot reload in development (such a file reloads the
    // page instead of hot-swapping), so these established modules are exempt;
    // new files still get it.
    files: [
      'src/context/AdminAuthContext.jsx',
      'src/forms/kit.jsx',
      'src/forms/VibeFields.jsx',
      'src/screens/catalogue/configs.jsx',
      'src/screens/catalogue/kit.jsx',
      'src/ui/DataView.jsx',
      'src/ui/index.jsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['**/*.test.{js,jsx}', 'vite.config.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
])
