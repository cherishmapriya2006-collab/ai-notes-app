/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        note: {
          pink: "#fde2e4",
          blue: "#cdeffd",
          purple: "#e7dffc",
          yellow: "#fff5b8",
          green: "#d0f4de",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
