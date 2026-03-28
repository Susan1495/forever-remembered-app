import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Golden Hour palette (primary)
        amber: {
          warm: '#D97706',
          dark: '#B45309',
          light: '#FEF3E2',
        },
        // Neutral warm tones
        brown: {
          900: '#1C1007',
          800: '#3D2B14',
          700: '#6B5A45',
          100: '#F0E0C8',
          50: '#FFFBF5',
        },
        // Theme-aware via CSS variables
        primary: 'var(--color-primary)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        'playfair': ['Playfair Display', 'Georgia', 'serif'],
        'garamond': ['EB Garamond', 'Garamond', 'Georgia', 'serif'],
        'cormorant': ['Cormorant Garamond', 'Garamond', 'Georgia', 'serif'],
        'dm-serif': ['DM Serif Display', 'Georgia', 'serif'],
      },
      animation: {
        'flicker': 'flicker 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-down': 'bounceDown 2s ease-in-out infinite',
        'pulse-fade': 'pulseFade 3s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1) rotate(-1deg)', opacity: '1' },
          '25%': { transform: 'scaleY(1.05) scaleX(0.95) rotate(1deg)', opacity: '0.95' },
          '50%': { transform: 'scaleY(0.95) scaleX(1.05) rotate(-2deg)', opacity: '1' },
          '75%': { transform: 'scaleY(1.02) scaleX(0.98) rotate(1deg)', opacity: '0.98' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bounceDown: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
        pulseFade: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
