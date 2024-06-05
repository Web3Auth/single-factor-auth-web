/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0364FF",
        purple_100: "#EDEBFE",
        purple_800: "#5521B5",
      },
    },
  },
  plugins: [],
};
