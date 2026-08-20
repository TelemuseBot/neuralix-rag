import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#08090c",
          900: "#0d0f14",
          800: "#12151c",
          700: "#1a1e28",
          600: "#252a37",
        },
        electric: {
          500: "#3b82f6",
          400: "#5b9dfb",
          300: "#8fbdfd",
        },
        signal: "#22d3a8",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.15), 0 0 24px rgba(59,130,246,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
