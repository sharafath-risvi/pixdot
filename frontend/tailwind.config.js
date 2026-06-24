/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    fontFamily: {
      sans: ["Montserrat", "ui-sans-serif", "system-ui", "-apple-system", "Arial", "sans-serif"],
      serif: ["Montserrat", "ui-sans-serif", "system-ui", "-apple-system", "Arial", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
    },
    extend: {
      colors: {
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          500: "#06b6d4",
          600: "#0891b2",
        },
      },
    },
  },
  plugins: [],
}
