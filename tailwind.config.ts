import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#312e81",
        accent: "#3b82f6",
        background: "#0f172a",
        angry: "#ef4444",
        happy: "#22c55e",
      },
      boxShadow: {
        glass: "0 24px 80px rgba(15, 23, 42, 0.18)",
      },
      backgroundImage: {
        "citizen-glow":
          "radial-gradient(circle at top, rgba(59, 130, 246, 0.24), transparent 38%), radial-gradient(circle at 20% 20%, rgba(49, 46, 129, 0.24), transparent 28%)",
        "dashboard-grid":
          "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
