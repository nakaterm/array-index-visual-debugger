/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["monospace"],
      },
      colors: {
        vscode: {
          bg: "#23272e",
          fg: "#ccc",
          border: "#444",
          button: "#007acc",
        },
      },
    },
  },
  plugins: [],
};