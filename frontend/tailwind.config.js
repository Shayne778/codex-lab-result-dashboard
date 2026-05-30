/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Syne", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        border: "var(--bg-border)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        accent: "var(--accent-primary)",
      },
      boxShadow: {
        glow: "0 0 30px var(--accent-glow)",
      },
    },
  },
  plugins: [],
};
