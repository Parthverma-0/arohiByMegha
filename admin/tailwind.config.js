/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F2',
        charcoal: '#231F20',
        gold: {
          DEFAULT: '#A9812F',
          light: '#C9A55C',
          dark: '#7A5C1E',
        },
        blush: '#EFE3D8',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
