/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nebula: {
          900: '#0f172a', // Deep space blue
          800: '#1e293b', // Lighter space
          500: '#6366f1', // Nebula purple/indigo
          400: '#818cf8', // Glow
        }
      }
    },
  },
  plugins: [],
}