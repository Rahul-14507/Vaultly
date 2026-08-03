/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0C",
        accent: {
          DEFAULT: "#F5A524",
          hover: "#E0921B",
          dim: "rgba(245, 165, 36, 0.1)",
          text: "#0A0A0C",
        },
        panel: {
          DEFAULT: "#111113",
          light: "#161619",
        },
        ui: {
          border: "#1F1F24",
          borderHover: "#2E2E36",
          textMain: "#E4E4E7",
          textMuted: "#8F8F9B",
          codeBackground: "#0E0E10",
        }
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        lg: ["20px", "28px"],
        xl: ["28px", "36px"],
      }
    },
  },
  plugins: [],
}
