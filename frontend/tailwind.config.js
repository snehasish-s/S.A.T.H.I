/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'sahayak-teal': '#0F766E',
        'sahayak-dark': '#134E4A',
        'sahayak-light': '#F0FDFA',
        'safety-red': '#DC2626',
        'safety-amber': '#D97706',
        'safety-green': '#16A34A',
        'india-saffron': '#FF9933',
        'india-saffron-dark': '#E67E22',
        'india-green': '#138808',
        'india-green-dark': '#0E6606',
        'india-navy': '#000080',
        'india-blue': '#1E3A8A',
        'gov-gold': '#D4AF37',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
};
