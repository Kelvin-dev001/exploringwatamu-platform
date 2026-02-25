/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#24b3b3',
        'primary-dark': '#1e7575',
        secondary: '#ffb347',
        cream: '#fbeec1',
        accent: '#46c3d6',
      },
    },
  },
  plugins: [],
}