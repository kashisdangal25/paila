/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Forest Green palette (primary)
        forest: {
          50: '#D8F3DC',
          100: '#B7E4C7',
          200: '#95D5B2',
          300: '#74C69D',
          400: '#52B788',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#1B4332',
          800: '#14352B',
          900: '#0D1E19',
          950: '#071310',
        },
        // Accent colors
        sunset: {
          400: '#FF8C5A',
          500: '#FF6B35',
          600: '#E85A2A',
        },
        ocean: {
          400: '#1976D2',
          500: '#1565C0',
          600: '#0D47A1',
        },
        purple: {
          400: '#9C27B0',
          500: '#7B1FA2',
          600: '#6A1B9A',
        },
        // Neutral tones
        stone: {
          50: '#F8FAF9',
          100: '#F1F4F3',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Status colors
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#E63946',
        star: '#F6B93B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['3.4rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-lg': ['2.4rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-md': ['1.8rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-sm': ['1.2rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 40px rgba(45, 106, 79, 0.12)',
        'phone': '0 24px 60px rgba(0, 0, 0, 0.2)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-nature': 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #0D2137 0%, #1565C0 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #8B2500 0%, #FF6B35 100%)',
      },
    },
  },
  plugins: [],
};
