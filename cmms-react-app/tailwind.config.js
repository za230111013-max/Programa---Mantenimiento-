/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secondary: {
          // Industrial Gray
          800: '#1f2937',
          900: '#111827',
        },
        status: {
          normal: '#22c55e',
          warning: '#f59e0b',
          critical: '#ef4444',
          offline: '#6b7280'
        }
      }
    },
  },
  plugins: [],
}
