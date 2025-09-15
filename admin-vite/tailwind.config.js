/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
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
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        exploringwatamu: {
          "primary": "#24b3b3", // teal
          "secondary": "#ffb347", // orange
          "accent": "#fbeec1", // cream
          "neutral": "#233d4d", // deep blue
          "base-100": "#ffffff",
        },
      },
    ],
    defaultTheme: "exploringwatamu",
  },
}