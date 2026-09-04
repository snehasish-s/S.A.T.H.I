/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'sahayak-teal': '#0F766E',
        'sahayak-dark': '#134E4A',
        'safety-red': '#DC2626',
        'safety-amber': '#D97706',
        'safety-green': '#16A34A',
      },
    },
  },
  plugins: [],
};
