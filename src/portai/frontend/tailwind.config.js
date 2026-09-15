/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        ocean: {
          base: "#061018",
          surface: "#0B1B23",
          elevated: "#10252E",
          border: "#1B3842",
          borderLight: "#224754",
        },
        brand: {
          cyan: "#28D7D1",
          cyanHover: "#55f4ed",
          cyanDim: "#166360",
          red: "#FF5964",
          redDim: "#3d191d",
          green: "#35D39A",
          greenDim: "#13382c",
          blue: "#7EB6FF",
        },
      },
      fontFamily: {
        sono: ['"Sono"', "monospace"],
        sans: ['"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
