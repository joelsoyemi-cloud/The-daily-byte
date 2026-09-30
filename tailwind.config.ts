import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        ink: '#141414',
        line: '#E7E7E7',
        muted: '#6B7280',
        brand: '#D6293B',
        gold: '#C9962B',
        accent: '#0E7C86',
        surface: '#F7F7F7',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
       soft: '0 2px 8px -2px rgba(20,20,20,0.06), 0 1px 2px -1px rgba(20,20,20,0.04)',
        'soft-lg': '0 12px 32px -8px rgba(20,20,20,0.14), 0 4px 12px -4px rgba(20,20,20,0.08)',
       'glow-brand': '0 8px 24px -6px rgba(214,41,59,0.25)',
      },
      keyframes: {
        ticker: {
        '0%': { transform: 'translateX(0)' },
        '100%': { transform: 'translateX(-50%)' },
       },
      },
      animation: {
        ticker: 'ticker 24s linear infinite',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
