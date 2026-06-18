/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#faf8f1', 2: '#f3efe3', 3: '#ece6d6' },
        ink: { DEFAULT: '#20261c', soft: '#56604c', faint: '#8a917f' },
        line: { DEFAULT: '#e6dfcd', strong: '#d8cfb8' },
        green: { DEFAULT: '#4f9d2e', deep: '#2f6e2a', ink: '#1d3a1a', soft: '#eaf3e1' },
        amber: { DEFAULT: '#e8851f', deep: '#bf6810', soft: '#fceedc' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        soft: '0 1px 2px rgba(40,50,30,.05), 0 6px 20px -10px rgba(40,50,30,.18)',
        lift: '0 18px 44px -22px rgba(40,55,25,.38)',
      },
      maxWidth: { content: '1160px' },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: { floaty: 'floaty 7s ease-in-out infinite' },
    },
  },
  plugins: [],
};
