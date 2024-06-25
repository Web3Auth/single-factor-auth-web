/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0364FF",
        purple_100: "#EDEBFE",
        purple_800: "#5521B5",
        text_primary: "#000000",
        text_primary2: "#595857",
        text_secondary: "#6B7280",
      },
    },
  },
  plugins: [],
};
