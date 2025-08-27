/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#24b3b3',
          cream: '#fbeec1',
          orange: '#ffb347',
          deepblue: '#233d4d',
        },
      },
    },
  },
  plugins: [],
}