import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      keyframes: {
        cardEnter: {
          '0%':   { opacity: '0', transform: 'translateY(18px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        sheikahGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(77,184,212,0.40), 0 0 0 1px rgba(77,184,212,0.28)' },
          '50%':       { boxShadow: '0 0 24px rgba(77,184,212,0.70), 0 0 0 2px rgba(77,184,212,0.50)' },
        },
      },
      animation: {
        'card-enter':    'cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'sheikah-pulse': 'sheikahGlow 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
