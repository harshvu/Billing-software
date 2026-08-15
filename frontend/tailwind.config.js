/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#2d4a28',
          dark: '#1f341c',
        },
        gold: '#f0a500',
      },
    },
  },
  plugins: [],
};
