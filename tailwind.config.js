/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AGM Color scheme
        agm: {
          dark: "#333333",
          green: "#4b5320",
          stone: "#f5f1e8",
        },
      },
    },
  },
  plugins: [],
};
