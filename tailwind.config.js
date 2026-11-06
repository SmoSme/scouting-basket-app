/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bba: {
          primary: 'rgb(2, 45, 50)',
          secondary: 'rgb(12, 161, 122)',
          tertiary: 'rgb(221, 243, 233)',
          light: '#F8F9FA',
          border: 'rgb(198, 232, 219)',
        },
        slate: {
          950: '#06090F',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        amber: {
          400: '#FFD700',
          500: '#F59E0B',
          600: '#D97706',
        }
      }
    },
  },
  plugins: [],
}
