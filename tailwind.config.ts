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
        brand: {
          bg: '#0a0907',
          gold: '#c9a96e',
          'gold-light': '#dfc28a',
          'gold-dim': '#8a6a3a',
          text: '#f0ebe2',
          stone: '#8a7f72',
          'stone-light': '#b5a99a',
          surface: '#141210',
          'surface-2': '#1e1b17',
          'surface-3': '#252119',
          border: '#2a2520',
          'border-light': '#3a342d',
        },
      },
      fontFamily: {
        copperplate: [
          '"Copperplate Gothic Bold"',
          '"Copperplate Gothic"',
          'Copperplate',
          '"Copperplate Gothic Light"',
          'serif',
        ],
        manrope: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
