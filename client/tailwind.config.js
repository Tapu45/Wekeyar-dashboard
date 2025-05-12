/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}", // Ensure Tailwind scans your files for classes
    ],
    theme: {
      extend: {
        fontFamily: {
          inter: ['Inter', 'sans-serif'], // Add Inter font
        },
      },
    },
    plugins: [],
  };