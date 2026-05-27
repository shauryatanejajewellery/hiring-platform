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
          bg: '#F6F1E8',         // ivory — main background
          forest: '#011B03',     // forest green — sidebar, primary buttons
          gold: '#CE9F55',       // gold — accents, scores, highlights
          'gold-light': '#D9B577',
          'gold-dim': '#A07830',
          text: '#2C2A25',       // near-black body text
          stone: '#7A7570',      // muted / secondary text
          'stone-light': '#5C5753',
          surface: '#FFFFFF',    // white card backgrounds
          'surface-2': '#F6F1E8', // ivory surface
          'surface-3': '#EDEAE3', // slightly darker ivory
          border: '#E8E2D6',
          'border-light': '#D5CFC4',
          burgundy: '#44050A',
          navy: '#0C1C2C',
        },
      },
      fontFamily: {
        copperplate: [
          'CopperplateGothicST',
          '"Copperplate Gothic Bold"',
          '"Copperplate Gothic"',
          'Copperplate',
          'serif',
        ],
        manrope: ['ManropeST', 'Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
