import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#54247A", dark: "#321449", light: "#F2EAF8" },
        gold: { DEFAULT: "#D4AF62", champagne: "#E9D7A5" },
        accent: "#F28C45", bg: "#FAF8FC", ink: "#241B2B",
      },
    },
  },
  plugins: [],
};
export default config;
