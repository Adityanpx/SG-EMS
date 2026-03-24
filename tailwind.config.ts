import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d5fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          purple: '#7c3aed',
          blue:   '#2563eb',
          cyan:   '#0891b2',
          pink:   '#db2777',
        },
      },
      backgroundImage: {
        'gradient-brand':
          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
        'gradient-dark':
          'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        'gradient-card':
          'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
        'gradient-rgb':
          'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef, #f43f5e)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':   'spin 8s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'rgb-shift':   'rgbShift 4s linear infinite',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        rgbShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        slideInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(99, 102, 241, 0.4)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config