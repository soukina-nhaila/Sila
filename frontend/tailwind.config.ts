import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#54247A", dark: "#321449", light: "#F2EAF8", 50: "#FAF6FD" },
        gold: { DEFAULT: "#D4AF62", champagne: "#E9D7A5" },
        accent: "#F28C45", bg: "#FAF8FC", ink: "#241B2B",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "Cambria", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(50,20,73,.05), 0 10px 30px -12px rgba(50,20,73,.15)",
        lift: "0 2px 4px rgba(50,20,73,.06), 0 24px 48px -16px rgba(84,36,122,.35)",
        gold: "0 8px 24px -8px rgba(212,175,98,.6)",
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        toastIn: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { floaty: "floaty 5s ease-in-out infinite", toast: "toastIn .25s ease-out" },
    },
  },
  plugins: [],
};
export default config;
