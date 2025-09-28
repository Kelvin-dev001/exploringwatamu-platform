module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        exploringwatamu: {
          "primary": "#24b3b3",
          "secondary": "#ffb347",
          "accent": "#fbeec1",
          "neutral": "#233d4d",
          "base-100": "#ffffff",
        },
      },
    ],
    defaultTheme: "exploringwatamu",
  },
}