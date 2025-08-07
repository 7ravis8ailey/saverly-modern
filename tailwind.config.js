/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Saverly Brand Colors (WCAG 2.1 AA Compliant)
        "saverly": {
          "green": "#2D8A5A",        // Darker for better contrast (AA: 4.5:1)
          "green-light": "#3ABF7E",  // Original color for decorative use
          "teal": "#1E7A6B",         // Darker teal for better contrast
          "light-green": "#4fd998",
          "dark-green": "#215843",   // Even darker for AA Large compliance
          "red": "#DC2626",          // WCAG AA compliant red
          "orange": "#EA580C",       // WCAG AA compliant orange
          "yellow": "#D97706",       // WCAG AA compliant yellow
        },
        // Legacy support with improved contrast
        "saverly-green": "#2D8A5A",          // Updated to compliant version
        "saverly-green-original": "#3ABF7E",  // Keep original for backgrounds
        "saverly-card-bg": "#FFFFFF",         // Pure white for better contrast
        "saverly-text-dark": "#111827",       // Darker text for better contrast
        "saverly-text-gray": "#4B5563",       // Darker gray for better contrast
        "saverly-muted": "#6B7280",           // WCAG AA compliant muted text
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}