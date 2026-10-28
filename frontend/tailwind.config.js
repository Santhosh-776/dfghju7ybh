/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#07856B',
          50: '#ecfdf5',
          100: '#d1fae5',
          600: '#07856B',
          700: '#066d57',
        },
        forecast: {
          DEFAULT: '#4778D0',
          50: '#eff6ff',
          100: '#dbeafe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
