/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    fontFamily: {
      sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "-apple-system", "Arial", "sans-serif"],
      serif: ["Space Grotesk", "ui-sans-serif", "system-ui", "-apple-system", "Arial", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
    },
    extend: {
      colors: {
        brand: {
          50: "#eef7fb",
          100: "#bdd8e9",
          200: "#9ec5dc",
          300: "#7bbde8",
          400: "#6ea2b3",
          500: "#4e8ea2",
          600: "#49769f",
          700: "#0a4174",
          800: "#0a4174",
          900: "#001d39",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f7f7fb",
          soft: "#f1f2f6",
        },
        ink: {
          DEFAULT: "#0e0e14",
          secondary: "#3a3a45",
          muted: "#656575",
        },
        line: {
          DEFAULT: "#e2e2ea",
          strong: "#d4d4de",
        },
      },
      borderRadius: {
        card: "1rem",
        panel: "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(14, 14, 20, 0.1)",
        card: "0 18px 50px -24px rgba(14, 14, 20, 0.16)",
        lift: "0 28px 64px -28px rgba(14, 14, 20, 0.2)",
      },
      letterSpacing: {
        tightest: "-0.05em",
        heading: "-0.04em",
      },
      lineHeight: {
        heading: "1.1",
        body: "1.65",
      },
    },
  },
  plugins: [],
}
