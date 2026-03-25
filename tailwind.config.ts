import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        teal: {

          DEFAULT: '#0D7377',
          light: '#0F8B90',
          dark: '#0A5C5F',
          50: '#E6F5F5',
          100: '#B3E2E3',
          200: '#80CFD1',
          500: '#0D7377',
          600: '#0A5C5F',
          700: '#084547',
          800: '#052E2F',
          900: '#031717',
        },
        orange: {
          DEFAULT: '#F4A261',
          light: '#F6B580',
          dark: '#E8893D',
          50: '#FEF5EC',
          100: '#FCE5CF',
          200: '#FAD5B2',
          500: '#F4A261',
          600: '#E8893D',
          700: '#D47020',
          800: '#A85919',
          900: '#7C4213',
        },
        cream: '#FFF8F0',
        charcoal: '#2D2D2D',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Nunito', 'sans-serif'],
      },

      borderRadius: {
        lg: 'calc(var(--radius) + 2px)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'sparkle': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(0) rotate(360deg)', opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'badge-reveal': {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(10deg)', opacity: '1' },
          '80%': { transform: 'scale(0.95) rotate(-5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-60px)', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'confetti-fall': 'confetti-fall 3s ease-in forwards',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'badge-reveal': 'badge-reveal 0.8s ease-out forwards',
        'float-up': 'float-up 1.5s ease-out forwards',
      },

      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    }
  },
  plugins: [
    animate,
    typography,
  ],
} satisfies Config;
