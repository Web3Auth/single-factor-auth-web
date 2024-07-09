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
        app: {
          primary: {
            900: "#233876",
            800: "#1e429f",
            700: "#1a56db",
            600: "#0346ff",
            500: "#3f83f8",
            400: "#76a9fa",
            300: "#a4cafe",
            200: "#c3ddfd",
            100: "#e1effe",
            50: "#ebf5ff",
          },
          gray: {
            900: "#111928",
            800: "#1f2a37",
            700: "#374151",
            600: "#4b5563",
            500: "#6b7280",
            400: "#9ca3af",
            300: "#d1d5db",
            200: "#e5e7eb",
            100: "#f3f4f6",
            50: "#f9fafb",
          },
          green: {
            900: "#014737",
            800: "#03543f",
            700: "#046c4e",
            600: "#057a55",
            500: "#0e9f6e",
            400: "#31c48d",
            300: "#84e1bc",
            200: "#bcf0da",
            100: "#def7ec",
            50: "#f3faf7",
          },
        },
      },
      boxShadow: {
        modal: "4px 4px 20px 0px #2E5BFF1A",
      },
    },
  },
  plugins: [],
};
