/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vietnam: {
          red: '#DA251D',
          yellow: '#FFFF00',
        },
      },
    },
  },
  plugins: [],
}
